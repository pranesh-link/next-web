"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CoupleMessage } from "@prisma/client";
import { markAllRead } from "../_actions/messages";
import { encryptMessage, decryptMessage } from "@/_lib/crypto";
import {
  ensureKeysBootstrapped,
  getCachedSharedKey,
} from "@/_lib/e2e/key-bootstrap";
import { useToast } from "@/couple/_components/shared/ToastProvider";

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

const NO_PARTNER_RECHECK_MS = 30_000;

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
  iv: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/couple/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type, iv, encrypted: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Decrypts encrypted messages; replaces plaintext rows with a lock placeholder. */
async function decryptAll(
  msgs: CoupleMessage[],
  sharedKey: CryptoKey | null,
): Promise<CoupleMessage[]> {
  return Promise.all(
    msgs.map(async (msg) => {
      if (!msg.encrypted || !msg.iv) {
        return { ...msg, content: "🔒 [legacy unencrypted]" };
      }
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
  const [encryptionReady, setEncryptionReady] = useState(
    () => getCachedSharedKey() !== null,
  );

  const lastCountRef = useRef<number>(-1);
  const memberNamesFetchedRef = useRef(false);
  const lastSignalRef = useRef<number>(0);
  const sharedKeyRef = useRef<CryptoKey | null>(getCachedSharedKey());
  const { showToast } = useToast();

  // ---------------------------------------------------------------------------
  // Crypto bootstrap — delegates to the eager bootstrap module. Re-checks every
  // 30s while mounted when the partner key is still missing.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const result = await ensureKeysBootstrapped();
      if (cancelled) return;

      if (result.status === "ready" && result.sharedKey) {
        sharedKeyRef.current = result.sharedKey;
        setEncryptionReady(true);
        return;
      }

      sharedKeyRef.current = null;
      setEncryptionReady(false);
      if (result.status === "no-partner") {
        timer = setTimeout(() => void tick(), NO_PARTNER_RECHECK_MS);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
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
  // Send — strict: refuses to send plaintext under any circumstance.
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(async (content: string, type: string) => {
    let key = sharedKeyRef.current;
    if (!key) {
      const result = await ensureKeysBootstrapped();
      if (result.status === "ready" && result.sharedKey) {
        sharedKeyRef.current = result.sharedKey;
        setEncryptionReady(true);
        key = result.sharedKey;
      } else {
        showToast(
          "Encryption not ready. Make sure your partner has signed in.",
          "error",
        );
        return;
      }
    }

    const { ciphertext, iv } = await encryptMessage(content, key);
    const ok = await postMessage(ciphertext, type, iv);
    if (ok) {
      const raw = await fetchMessages();
      const msgs = await decryptAll(raw, sharedKeyRef.current);
      setMessages([...msgs].reverse());
      if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
    }
  }, [showToast]);

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
