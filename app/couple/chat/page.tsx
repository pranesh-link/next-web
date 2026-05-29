"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import MessageBubble from "./_components/MessageBubble";
import ChatInput from "./_components/ChatInput";
import { useCoupleChat } from "./_hooks/useCoupleChat";
import {
  ChatPageWrapper,
  MessagesArea,
  EmptyState,
  NoCoupleCard,
  NoCoupleEmoji,
  InviteButton,
} from "./_components/_chat.styled";
import { DateDivider, ScrollToBottomButton, TypingIndicator, EncryptionBanner } from "./_components/_chat-extras.styled";

/**
 * Format a date as a human-readable day label.
 *
 * @param date - The date to format.
 * @returns A string like "Monday, Jan 5".
 */
function formatDateLabel(date: Date | string): string {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Return true when two dates fall on the same calendar day.
 *
 * @param a - First date.
 * @param b - Second date.
 * @returns True when both dates share year, month, and day.
 */
function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Chat page — real-time couple messaging with SSE polling, date separators,
 * emoji reactions, and a scroll-to-bottom button.
 *
 * @returns The full chat page JSX including header, message list, and input bar.
 */
export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const { messages, noCouple, loading, memberNames, partnerTyping, handleSend, handleRefresh, handleReact, signalTyping, encryptionReady } =
    useCoupleChat(userId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  /** Scroll to the bottom of the message list. */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track scroll position to show/hide the scroll-to-bottom button
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (!area) return;
    const handleScroll = () => {
      const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    area.addEventListener("scroll", handleScroll, { passive: true });
    return () => area.removeEventListener("scroll", handleScroll);
  }, []);

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

      <MessagesArea ref={messagesAreaRef}>
        <EncryptionBanner $active={encryptionReady}>
          {encryptionReady ? "🔒 End-to-end encrypted" : "⚠️ Encryption not yet active — partner hasn't connected"}
        </EncryptionBanner>

        {!loading && messages.length === 0 && (
          <EmptyState>
            <span>💬</span>
            <p>No messages yet. Say hello!</p>
          </EmptyState>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showDate = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
          const isGrouped = !!prevMsg && prevMsg.senderId === msg.senderId && !showDate;

          return (
            <Fragment key={msg.id}>
              {showDate && (
                <DateDivider>{formatDateLabel(msg.createdAt)}</DateDivider>
              )}
              {!showDate && prevMsg && prevMsg.encrypted !== msg.encrypted && (
                <EncryptionBanner $active={msg.encrypted}>
                  {msg.encrypted ? "🔒 Messages are now end-to-end encrypted" : "⚠️ Messages sent without encryption"}
                </EncryptionBanner>
              )}
              <MessageBubble
                message={msg}
                isMine={msg.senderId === userId}
                senderName={msg.senderId === userId ? "You" : (memberNames[msg.senderId] ?? "Partner")}
                currentUserId={userId}
                onReact={handleReact}
                isGrouped={isGrouped}
              />
            </Fragment>
          );
        })}

        {partnerTyping && (
          <TypingIndicator>
            <span /><span /><span />
          </TypingIndicator>
        )}
        <div ref={bottomRef} />
      </MessagesArea>

      {showScrollBtn && (
        <ScrollToBottomButton onClick={scrollToBottom} aria-label="Scroll to bottom">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </ScrollToBottomButton>
      )}

      <ChatInput onSend={handleSend} signalTyping={signalTyping} disabled={loading} />
    </ChatPageWrapper>
  );
}


