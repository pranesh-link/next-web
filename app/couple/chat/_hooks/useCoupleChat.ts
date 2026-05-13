"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CoupleMessage } from "@prisma/client";
import { markAllRead } from "../_actions/messages";

interface StreamPayload {
  count: number;
  latest: Pick<CoupleMessage, "id" | "senderId" | "content" | "type" | "createdAt"> | null;
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

async function postMessage(content: string, type: string): Promise<boolean> {
  try {
    const res = await fetch("/api/couple/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface UseCoupleChat {
  messages: CoupleMessage[];
  noCouple: boolean;
  coupleId: string | null;
  loading: boolean;
  memberNames: Record<string, string>;
  partnerTyping: boolean;
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
  const lastCountRef = useRef<number>(-1);
  const memberNamesFetchedRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignalRef = useRef<number>(0);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/couple/chat/messages", { cache: "no-store" });
      const json = await res.json();

      if (!json.success && json.error === "No couple found") {
        setNoCouple(true);
        setLoading(false);
        return;
      }

      const msgs: CoupleMessage[] = json.success ? json.data : [];
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

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (coupleId) markAllRead(coupleId);
  }, [coupleId]);

  useEffect(() => {
    if (noCouple) return;

    const source = new EventSource("/api/couple/chat/stream");

    source.onmessage = async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as StreamPayload & { partnerTyping?: boolean };
        if (payload.count !== lastCountRef.current) {
          lastCountRef.current = payload.count;
          const msgs = await fetchMessages();
          setMessages([...msgs].reverse());
          if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
          if (coupleId) markAllRead(coupleId);
          setPartnerTyping(false); // clear typing when message arrives
        }
        setPartnerTyping(payload.partnerTyping ?? false);
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      // Stream closed (28s limit hit) — fetch immediately to bridge the reconnect gap
      lastCountRef.current = -1;
      void fetchMessages().then((msgs) => {
        if (msgs.length > 0) {
          setMessages([...msgs].reverse());
          if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
        }
      });
    };

    return () => source.close();
  }, [noCouple, coupleId]);

  /** Throttled signal: fires a PATCH at most once per 2 s; Redis TTL handles expiry. */
  const signalTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSignalRef.current < 2000) return;
    lastSignalRef.current = now;
    fetch("/api/couple/chat/typing", { method: "PATCH" }).catch(() => {});
  }, []);

  const handleSend = useCallback(async (content: string, type: string) => {
    const ok = await postMessage(content, type);
    if (ok) {
      const msgs = await fetchMessages();
      setMessages([...msgs].reverse());
      if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
    }
  }, []);

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

  return { messages, noCouple, coupleId, loading, memberNames, partnerTyping, handleSend, handleRefresh, handleReact, signalTyping };
}
