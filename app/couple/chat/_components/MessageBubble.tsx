"use client";

import { linkify } from "@/_utils/common/linkify";
import type { CoupleMessage } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ReactionBar,
    ReactionBarBtn,
    ReactionBarWrapper,
    ReactionPill,
    ReactionRow,
} from "./_chat-extras.styled";
import {
    AvatarCircle,
    BubbleBox,
    BubbleColumn,
    BubbleMeta,
    BubbleRow,
    BubbleSender,
    BubbleText,
    BubbleTime,
    BulletItem,
    BulletList,
    ReminderWrapper,
} from "./_chat.styled";

/** Quick-reaction emojis shown in the long-press / right-click bar. */
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮"];

/** Delay in ms before a touch is considered a long-press. */
const LONG_PRESS_DELAY = 500;

/** Props for {@link MessageBubble}. */
interface MessageBubbleProps {
  /** The CoupleMessage record to display. */
  message: CoupleMessage;
  /** Whether this message was sent by the currently logged-in user. */
  isMine: boolean;
  /** Display name for the sender. Shows "You" when isMine is true. */
  senderName: string;
  /** ID of the currently logged-in user (used to highlight own reactions). */
  currentUserId?: string;
  /** Called when the user picks a reaction emoji. */
  onReact?: (messageId: string, emoji: string) => void;
  /** Whether this message is grouped with the previous one from the same sender. */
  isGrouped?: boolean;
}

/**
 * Format a Date to a short HH:MM string.
 *
 * @param date - The date to format.
 * @returns A short time string like "14:05".
 */
function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Render the inner content of a bubble based on the message type.
 *
 * @param message - The CoupleMessage to render.
 * @param isMine - Whether the message belongs to the current user.
 * @returns JSX content appropriate for the message type.
 */
function BubbleContent({ message, isMine }: Pick<MessageBubbleProps, "message" | "isMine">) {
  switch (message.type) {
    case "LIST": {
      const items = message.content.split("\n").filter(Boolean);
      return (
        <BulletList>
          {items.map((item, i) => (
            <BulletItem key={i} dangerouslySetInnerHTML={{ __html: linkify(item) }} />
          ))}
        </BulletList>
      );
    }

    case "REMINDER":
      return (
        <ReminderWrapper>
          <span>🔔</span>
          <BubbleText dangerouslySetInnerHTML={{ __html: linkify(message.content) }} />
        </ReminderWrapper>
      );

    case "AI_RESPONSE":
      return (
        <ReminderWrapper>
          <span>🤖</span>
          <BubbleText dangerouslySetInnerHTML={{ __html: linkify(message.content) }} />
        </ReminderWrapper>
      );

    default:
      return <BubbleText dangerouslySetInnerHTML={{ __html: linkify(message.content) }} />;
  }
}

/**
 * Renders a single chat message as a positioned bubble with avatar, sender name, and time.
 *
 * Supports emoji reactions via long-press (mobile) or right-click (desktop).
 *
 * @param message - The CoupleMessage to display.
 * @param isMine - Positions the bubble on the right when true.
 * @param senderName - Label shown above the bubble.
 * @param currentUserId - ID of the signed-in user for highlighting own reactions.
 * @param onReact - Callback when the user selects a reaction.
 * @param isGrouped - Whether to group with the previous same-sender message.
 * @returns JSX for one message row.
 */
export default function MessageBubble({
  message,
  isMine,
  senderName,
  currentUserId,
  onReact,
  isGrouped: _isGrouped,
}: MessageBubbleProps) {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionBarRef = useRef<HTMLDivElement>(null);
  const initial = senderName.charAt(0).toUpperCase();
  const isAI = message.type === "AI_RESPONSE";

  // Dismiss reaction bar when clicking outside
  useEffect(() => {
    if (!showReactionBar) return;
    const handler = (e: MouseEvent) => {
      if (reactionBarRef.current && !reactionBarRef.current.contains(e.target as Node)) {
        setShowReactionBar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReactionBar]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Allow native browser context menu on links (open in new tab, copy URL, etc.)
    if ((e.target as HTMLElement).closest("a")) return;
    e.preventDefault();
    setShowReactionBar(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Let links handle their own touch so tapping a link navigates normally
    if ((e.target as HTMLElement).closest("a")) return;
    pressTimerRef.current = setTimeout(() => setShowReactionBar(true), LONG_PRESS_DELAY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleReact = useCallback(
    (emoji: string) => {
      onReact?.(message.id, emoji);
      setShowReactionBar(false);
    },
    [message.id, onReact],
  );

  const reactions = (message.payload as { reactions?: Record<string, string[]> } | null)
    ?.reactions;
  const reactionEntries = reactions
    ? Object.entries(reactions).filter(([, users]) => users.length > 0)
    : [];

  return (
    <BubbleRow $isMine={isMine}>
      <AvatarCircle $isMine={isMine}>{initial}</AvatarCircle>
      <BubbleColumn $isMine={isMine}>
        <BubbleMeta>
          <BubbleSender>{senderName}</BubbleSender>
          <BubbleTime>{formatTime(message.createdAt)}</BubbleTime>
        </BubbleMeta>

        {showReactionBar && (
          <ReactionBarWrapper ref={reactionBarRef}>
            <ReactionBar>
              {QUICK_REACTIONS.map((emoji) => (
                <ReactionBarBtn
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </ReactionBarBtn>
              ))}
            </ReactionBar>
          </ReactionBarWrapper>
        )}

        <BubbleBox
          $isMine={isMine}
          $isAI={isAI}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          <BubbleContent message={message} isMine={isMine} />
        </BubbleBox>

        {reactionEntries.length > 0 && (
          <ReactionRow>
            {reactionEntries.map(([emoji, users]) => (
              <ReactionPill
                key={emoji}
                type="button"
                $mine={currentUserId ? users.includes(currentUserId) : false}
                onClick={() => handleReact(emoji)}
                aria-label={`${emoji} ${users.length}`}
              >
                {emoji} {users.length}
              </ReactionPill>
            ))}
          </ReactionRow>
        )}
      </BubbleColumn>
    </BubbleRow>
  );
}


