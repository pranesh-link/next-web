"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CoupleMessage } from "@prisma/client";
import { markAllRead } from "../_actions/messages";
import {
  getOrGenerateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from "@/_lib/crypto";

interface StreamPayload {
  count: number;
  latest: {
    id: string;
    senderId: string;
    content: string;
    iv: string | null;
    encrypted: boolean;
    type: string;
    createdAt: string;
  } | null;
  partnerTyping?: boolean;
}

async function fetchMessages(): Promise<CoupleMessage[]> {
  try {
    const res = await fetch("/api/couple/chat/messages", { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? (json.data as CoupleMessage[]) : [];
  } catch {
    return [];
  }
}

async function postMessage(
  content: string,
  type: string,
  iv?: string,
  encrypted = false,
): Promise<boolean> {
  try {
    const res = await fetch("/api/couple/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type, iv, encrypted }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Decrypts any encrypted messages in-place; leaves plaintext messages untouched. */
async function decryptAll(
  msgs: CoupleMessage[],
  sharedKey: CryptoKey | null,
): Promise<CoupleMessage[]> {
  return Promise.all(
    msgs.map(async (msg) => {
      if (!msg.encrypted || !msg.iv) return msg;
      if (!sharedKey) return { ...msg, content: "🔒 [encrypted message]" };
      const plaintext = await decryptMessage(msg.content, msg.iv, sharedKey);
      return { ...msg, content: plaintext ?? "🔒 [decryption failed]" };
    }),
  );
}

export interface UseCoupleChat {
  messages: CoupleMessage[];
  noCouple: boolean;
  coupleId: string | null;
  loading: boolean;
  memberNames: Record<string, string>;
  partnerTyping: boolean;
  /** True once both the local keypair and the partner's public key are ready. */
  encryptionReady: boolean;
  handleSend: (content: string, type: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleReact: (messageId: string, emoji: string) => Promise<void>;
  signalTyping: () => void;
}

export function useCoupleChat(userId: string): UseCoupleChat {
  const [messages, setMessages] = useState<CoupleMessage[]>([]);
  const [noCouple, setNoCouple] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [encryptionReady, setEncryptionReady] = useState(false);

  const lastCountRef = useRef<number>(-1);
  const memberNamesFetchedRef = useRef(false);
  const lastSignalRef = useRef<number>(0);
  const sharedKeyRef = useRef<CryptoKey | null>(null);

  // ---------------------------------------------------------------------------
  // Crypto initialisation — runs once on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function initCrypto() {
      try {
        const keyPair = await getOrGenerateKeyPair();
        const publicKeyB64 = await exportPublicKey(keyPair.publicKey);

        // Upload public key (idempotent — safe to call on every session start)
        await fetch("/api/v1/user/public-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: publicKeyB64 }),
        });

        // Fetch partner's public key and derive the shared AES-256-GCM key
        const partnerRes = await fetch("/api/v1/couple/partner-public-key");
        if (partnerRes.ok) {
          const { publicKey: partnerB64 } = (await partnerRes.json()) as {
            publicKey: string | null;
          };
          if (partnerB64) {
            const partnerKey = await importPublicKey(partnerB64);
            sharedKeyRef.current = await deriveSharedKey(keyPair.privateKey, partnerKey);
            setEncryptionReady(true);
          }
        }
      } catch {
        // Crypto init failure is non-fatal — messages fall back to plaintext
      }
    }
    void initCrypto();
  }, []);

  // ---------------------------------------------------------------------------
  // Message loading
  // ---------------------------------------------------------------------------
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/couple/chat/messages", { cache: "no-store" });
      const json = await res.json();

      if (!json.success && json.error === "No couple found") {
        setNoCouple(true);
        setLoading(false);
        return;
      }

      const raw: CoupleMessage[] = json.success ? json.data : [];
      const msgs = await decryptAll(raw, sharedKeyRef.current);
      setMessages([...msgs].reverse());
      if (msgs[0]?.coupleId) {
        const cid = msgs[0].coupleId;
        setCoupleId(cid);
        if (!memberNamesFetchedRef.current) {
          memberNamesFetchedRef.current = true;
          fetch(`/api/v1/couple/members`)
            .then((r) => r.json())
            .then((data: { id: string; name: string | null; email: string }[]) => {
              const map: Record<string, string> = {};
              data.forEach((m) => { map[m.id] = m.name ?? m.email; });
              setMemberNames(map);
            })
            .catch(() => {});
        }
      }
    } catch {
      // network error
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (coupleId) void markAllRead(coupleId);
  }, [coupleId]);

  // ---------------------------------------------------------------------------
  // SSE stream
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (noCouple) return;

    const source = new EventSource("/api/couple/chat/stream");

    source.onmessage = async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as StreamPayload;
        if (payload.count !== lastCountRef.current) {
          lastCountRef.current = payload.count;
          const raw = await fetchMessages();
          const msgs = await decryptAll(raw, sharedKeyRef.current);
          setMessages([...msgs].reverse());
          if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
          if (coupleId) void markAllRead(coupleId);
          setPartnerTyping(false);
        }
        setPartnerTyping(payload.partnerTyping ?? false);
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      lastCountRef.current = -1;
      void fetchMessages().then(async (raw) => {
        if (raw.length > 0) {
          const msgs = await decryptAll(raw, sharedKeyRef.current);
          setMessages([...msgs].reverse());
          if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
        }
      });
    };

    return () => source.close();
  }, [noCouple, coupleId]);

  // ---------------------------------------------------------------------------
  // Send — encrypt when sharedKey is available, fall back to plaintext
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(async (content: string, type: string) => {
    let ciphertext = content;
    let iv: string | undefined;
    let encrypted = false;

    if (sharedKeyRef.current) {
      const result = await encryptMessage(content, sharedKeyRef.current);
      ciphertext = result.ciphertext;
      iv = result.iv;
      encrypted = true;
    }

    const ok = await postMessage(ciphertext, type, iv, encrypted);
    if (ok) {
      const raw = await fetchMessages();
      const msgs = await decryptAll(raw, sharedKeyRef.current);
      setMessages([...msgs].reverse());
      if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Typing indicator
  // ---------------------------------------------------------------------------
  const signalTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSignalRef.current < 2000) return;
    lastSignalRef.current = now;
    fetch("/api/couple/chat/typing", { method: "PATCH" }).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh + React
  // ---------------------------------------------------------------------------
  const handleRefresh = useCallback(async () => { await loadMessages(); }, [loadMessages]);

  const handleReact = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const payload = (msg.payload as Record<string, unknown>) ?? {};
          const reactions = (payload.reactions as Record<string, string[]> | undefined) ?? {};
          const users = reactions[emoji] ?? [];
          const newUsers = users.includes(userId)
            ? users.filter((id) => id !== userId)
            : [...users, userId];
          return { ...msg, payload: { ...payload, reactions: { ...reactions, [emoji]: newUsers } } };
        }),
      );
      try {
        await fetch(`/api/couple/chat/messages/${messageId}/react`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
      } catch {}
    },
    [userId],
  );

  return {
    messages,
    noCouple,
    coupleId,
    loading,
    memberNames,
    partnerTyping,
    encryptionReady,
    handleSend,
    handleRefresh,
    handleReact,
    signalTyping,
  };
}

