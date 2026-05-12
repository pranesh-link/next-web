"use client";

import type { CoupleMessage } from "@prisma/client";
import {
  BubbleRow,
  AvatarCircle,
  BubbleColumn,
  BubbleMeta,
  BubbleSender,
  BubbleTime,
  BubbleBox,
  BubbleText,
  BulletList,
  BulletItem,
  ReminderWrapper,
} from "./_chat.styled";

/** Props for {@link MessageBubble}. */
interface MessageBubbleProps {
  /** The CoupleMessage record to display. */
  message: CoupleMessage;
  /** Whether this message was sent by the currently logged-in user. */
  isMine: boolean;
  /** Display name for the sender. Shows "You" when isMine is true. */
  senderName: string;
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
            <BulletItem key={i}>{item}</BulletItem>
          ))}
        </BulletList>
      );
    }

    case "REMINDER":
      return (
        <ReminderWrapper>
          <span>🔔</span>
          <BubbleText>{message.content}</BubbleText>
        </ReminderWrapper>
      );

    case "AI_RESPONSE":
      return (
        <ReminderWrapper>
          <span>🤖</span>
          <BubbleText>{message.content}</BubbleText>
        </ReminderWrapper>
      );

    default:
      return <BubbleText>{message.content}</BubbleText>;
  }
}

/**
 * Renders a single chat message as a positioned bubble with avatar, sender name, and time.
 *
 * @param message - The CoupleMessage to display.
 * @param isMine - Positions the bubble on the right when true.
 * @param senderName - Label shown above the bubble.
 * @returns JSX for one message row.
 */
export default function MessageBubble({ message, isMine, senderName }: MessageBubbleProps) {
  const initial = senderName.charAt(0).toUpperCase();
  const isAI = message.type === "AI_RESPONSE";

  return (
    <BubbleRow $isMine={isMine}>
      <AvatarCircle $isMine={isMine}>{initial}</AvatarCircle>
      <BubbleColumn $isMine={isMine}>
        <BubbleMeta>
          <BubbleSender>{senderName}</BubbleSender>
          <BubbleTime>{formatTime(message.createdAt)}</BubbleTime>
        </BubbleMeta>
        <BubbleBox $isMine={isMine} $isAI={isAI}>
          <BubbleContent message={message} isMine={isMine} />
        </BubbleBox>
      </BubbleColumn>
    </BubbleRow>
  );
}
