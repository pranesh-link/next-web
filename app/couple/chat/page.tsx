"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { CoupleMessage } from "@prisma/client";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import MessageBubble from "./_components/MessageBubble";
import ChatInput from "./_components/ChatInput";
import { markAllRead } from "./_actions/messages";
import {
  ChatPageWrapper,
  MessagesArea,
  EmptyState,
  NoCoupleCard,
  NoCoupleEmoji,
  InviteButton,
} from "./_components/_chat.styled";

/** State describing the SSE event payload. */
interface StreamPayload {
  count: number;
  latest: Pick<CoupleMessage, "id" | "senderId" | "content" | "type" | "createdAt"> | null;
}

/**
 * Fetch messages from the REST endpoint.
 *
 * @returns Ordered array of CoupleMessage records (newest first), or empty array on error.
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

/**
 * Chat page — real-time couple messaging with SSE polling.
 *
 * @returns The full chat page JSX including header, message list, and input bar.
 */
export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const [messages, setMessages] = useState<CoupleMessage[]>([]);
  const [noCouple, setNoCouple] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef<number>(-1);

  /** Scroll to the bottom of the message list. */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /** Load messages and determine couple state from a single fetch. */
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
      // newest-first from API → reverse for display (oldest at top)
      setMessages([...msgs].reverse());
      if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
    } catch {
      // network error — show empty state, not no-couple state
    }
    setLoading(false);
  }, []);

  // Initial load + mark read
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Mark all read whenever coupleId is known
  useEffect(() => {
    if (coupleId) markAllRead(coupleId);
  }, [coupleId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // SSE subscription — reconnects automatically via EventSource
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

  /** Handle sending a new message. */
  const handleSend = useCallback(
    async (content: string, type: string) => {
      const ok = await postMessage(content, type);
      if (ok) {
        const msgs = await fetchMessages();
        setMessages([...msgs].reverse());
        if (msgs[0]?.coupleId) setCoupleId(msgs[0].coupleId);
        scrollToBottom();
      }
    },
    [scrollToBottom],
  );

  /** Handle manual refresh. */
  const handleRefresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  if (noCouple) {
    return (
      <ChatPageWrapper>
        <FinanceHeader title="Chat" />
        <NoCoupleCard>
          <NoCoupleEmoji>💬</NoCoupleEmoji>
          <h3>No partner yet</h3>
          <p>Invite your partner to start messaging, share lists, and set reminders together.</p>
          <InviteButton as={Link} href="/couple/invite">
            Invite Partner
          </InviteButton>
        </NoCoupleCard>
      </ChatPageWrapper>
    );
  }

  return (
    <ChatPageWrapper>
      <FinanceHeader title="Chat" onRefresh={handleRefresh} />

      <MessagesArea>
        {!loading && messages.length === 0 && (
          <EmptyState>
            <span>💬</span>
            <p>No messages yet. Say hello!</p>
          </EmptyState>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.senderId === userId}
            senderName={msg.senderId === userId ? "You" : "Partner"}
          />
        ))}

        <div ref={bottomRef} />
      </MessagesArea>

      <ChatInput onSend={handleSend} disabled={loading} />
    </ChatPageWrapper>
  );
}
