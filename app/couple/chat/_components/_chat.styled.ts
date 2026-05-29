import { EASING } from "@/couple/_constants/theme";
import styled from "styled-components";

// ─── Page layout ──────────────────────────────────────────────────────────────

/** Full-height wrapper for the chat page. */
export const ChatPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
  position: relative;
`;

/** Scrollable area that holds all message bubbles. */
export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

/** Shown when there are no messages yet. */
export const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
  gap: 8px;

  span {
    font-size: 40px;
  }
`;

/** Card displayed when the user has no couple yet. */
export const NoCoupleCard = styled.div`
  margin: auto;
  max-width: 400px;
  text-align: center;
  padding: 48px 32px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-elevated);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-muted);
    margin: 0 0 24px;
    line-height: 1.6;
  }
`;

/** Large emoji displayed in the no-couple prompt card. */
export const NoCoupleEmoji = styled.span`
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
`;

/** Link/button to go to the invite page. */
export const InviteButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  border-radius: 24px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ${EASING};

  &:hover {
    filter: brightness(1.1);
  }
`;

// ─── Message bubble ────────────────────────────────────────────────────────────

/** Outer row — reversed when isMine is true (pushes bubble to the right). */
export const BubbleRow = styled.div<{ $isMine: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-direction: ${(p) => (p.$isMine ? "row-reverse" : "row")};
  margin-bottom: 8px;
`;

/** Circular avatar showing the sender's initial. */
export const AvatarCircle = styled.div<{ $isMine: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) => (p.$isMine ? "var(--accent)" : "var(--surface)")};
  color: ${(p) => (p.$isMine ? "#fff" : "var(--text)")};
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

/** Column holding sender name + bubble content. */
export const BubbleColumn = styled.div<{ $isMine: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.$isMine ? "flex-end" : "flex-start")};
  max-width: 70%;
  min-width: 0;
  position: relative;

  @media (max-width: 480px) {
    max-width: 85%;
  }
`;

/** Sender name + timestamp row. */
export const BubbleMeta = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 3px;
`;

/** Sender name label. */
export const BubbleSender = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

/** Message timestamp label. */
export const BubbleTime = styled.span`
  font-size: 10px;
  color: var(--text-muted);
`;

/** The visible bubble background. */
export const BubbleBox = styled.div<{ $isMine: boolean; $isAI?: boolean }>`
  padding: 10px 14px;
  border-radius: ${(p) => (p.$isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px")};
  background: ${(p) => {
    if (p.$isAI) return "color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))";
    return p.$isMine ? "var(--accent)" : "var(--bg-elevated)";
  }};
  color: ${(p) => (p.$isMine ? "#fff" : "var(--text)")};
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid ${(p) => (p.$isMine ? "transparent" : "var(--border)")};
  word-break: break-word;
  transition: transform 0.15s ease;
  &:hover { transform: translateY(-1px); }
`;

/** Plain text content inside a bubble. */
export const BubbleText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  a {
    color: inherit;
    text-decoration: underline;
    opacity: 0.85;
    &:hover { opacity: 1; }
  }
`;
/** Bullet list for LIST-type messages. */
export const BulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/** Single bullet item. */
export const BulletItem = styled.li`
  font-size: 14px;
  line-height: 1.4;
`;

/** Reminder wrapper — shows a bell icon before the content. */
export const ReminderWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  line-height: 1.5;
`;

// ─── Chat input bar ────────────────────────────────────────────────────────────

/** Sticky footer form holding the type selector + text input + send button. */
export const InputWrapper = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-elevated);
  flex-shrink: 0;
  position: relative;

  @media (max-width: 768px) {
    padding: 10px 12px 14px;
  }

  @media (max-width: 480px) {
    flex-wrap: wrap;
    align-items: flex-end;
  }
`;

/** Dropdown for choosing the message type. */
export const TypeSelect = styled.select`
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  appearance: none;
  outline: none;
  transition: border-color 0.2s ${EASING};

  &:focus {
    border-color: var(--accent);
  }
`;

/** Expanding text input. */
export const MessageInput = styled.input`
  flex: 1;
  min-width: 0;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 10px 18px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ${EASING};

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent);
  }
`;

/** Send button. */
export const SendButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ${EASING};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: scale(1.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;
