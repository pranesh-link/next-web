"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CoupleMessage } from "@prisma/client";
import { markAllRead } from "../_actions/messages";

/** Payload received from the SSE stream endpoint. */
interface StreamPayload {
  count: number;
  latest: Pick<CoupleMessage, "id" | "senderId" | "content" | "type" | "createdAt"> | null;
}

/**
 * Fetch messages from the REST endpoint (newest first).
 *
 * @returns Ordered array of CoupleMessage records, or empty array on error.
 */
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

/**
 * POST a new message to the REST endpoint.
 *
 * @param content - Message text.
 * @param type - MessageType string.
 * @returns True when the request succeeded.
 */
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

/** Return value of {@link useCoupleChat}. */
export interface UseCoupleChat {
  /** Ordered message list (oldest first). */
  messages: CoupleMessage[];
  /** True when the user has no couple linked yet. */
  noCouple: boolean;
  /** The couple ID once known. */
  coupleId: string | null;
  /** True while the initial load is in progress. */
  loading: boolean;
  /** Map of userId → display name for all couple members. */
  memberNames: Record<string, string>;
  /** Send a new message. */
  handleSend: (content: string, type: string) => Promise<void>;
  /** Refresh the message list manually. */
  handleRefresh: () => Promise<void>;
  /** Toggle a reaction on a message (optimistic update). */
  handleReact: (messageId: string, emoji: string) => Promise<void>;
}

/**
 * Manages couple chat state, SSE subscription, and all message operations.
 *
 * @param userId - The signed-in user's ID (used for optimistic reaction updates).
 * @returns Chat state and action handlers.
 */
export function useCoupleChat(userId: string): UseCoupleChat {
  const [messages, setMessages] = useState<CoupleMessage[]>([]);
  const [noCouple, setNoCouple] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const lastCountRef = useRef<number>(-1);

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
        // Fetch real member names once we know the couple
        fetch(`/api/v1/couple/members`)
          .then((r) => r.json())
          .then((data: { id: string; name: string | null; email: string }[]) => {
            const map: Record<string, string> = {};
            data.forEach((m) => { map[m.id] = m.name ?? m.email; });
            setMemberNames(map);
          })
          .catch(() => {/* keep empty map */});
      }
    } catch {
      // network error — keep empty state
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (coupleId) markAllRead(coupleId);
  }, [coupleId]);

  useEffect(() => {
    if (noCouple) return;

    const source = new EventSource("/api/couple/chat/stream");

    source.onmessage = async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as StreamPayload;
        if (payload.count !== lastCountRef.current) {
          lastCountRef.current = payload.count;
          const msgs = await fetchMessages();
          setMessages([...msgs].reverse());
          if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
          if (coupleId) markAllRead(coupleId);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => source.close();
  }, [noCouple, coupleId]);

  const handleSend = useCallback(async (content: string, type: string) => {
    const ok = await postMessage(content, type);
    if (ok) {
      const msgs = await fetchMessages();
      setMessages([...msgs].reverse());
      if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

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
          return {
            ...msg,
            payload: { ...payload, reactions: { ...reactions, [emoji]: newUsers } },
          };
        }),
      );

      try {
        await fetch(`/api/couple/chat/messages/${messageId}/react`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
      } catch {
        // silent fail — reaction desyncs on next reload
      }
    },
    [userId],
  );

  return { messages, noCouple, coupleId, loading, memberNames, handleSend, handleRefresh, handleReact };
}
