import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Bounce animation used by {@link TypingIndicator} dots. */
const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
`;

/** Centered date separator rendered between message groups from different days. */
export const DateDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
  color: var(--text-muted);
  font-size: 0.75rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
`;

/** Three bouncing dots shown while the partner is composing a message. */
export const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px 16px 16px 4px;
  width: fit-content;
  margin: 4px 0;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-muted);
    animation: ${bounce} 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
`;

/** Floating button that scrolls the message list to the bottom. */
export const ScrollToBottomButton = styled.button`
  position: absolute;
  bottom: 80px;
  right: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4);
  transition: all 0.2s ${EASING};
  z-index: 10;

  &:hover {
    transform: scale(1.08);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

/** Row of message-type toggle buttons that replaces the old `<select>` dropdown. */
export const TypeToggleBar = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 100%;
    order: -1;
  }
`;

/** Individual type toggle button within {@link TypeToggleBar}. */
export const TypeToggleBtn = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$active ? "var(--accent)" : "var(--border)")};
  background: ${(p) =>
    p.$active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent"};
  color: ${(p) => (p.$active ? "var(--accent)" : "var(--text-muted)")};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
`;

/** Emoji picker popover anchored above the trigger button. */
export const EmojiPickerWrapper = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 20;
`;

/** Single emoji button inside {@link EmojiPickerWrapper}. */
export const EmojiBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.3rem;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;

  &:hover {
    background: var(--surface);
  }
`;

/** Button that opens/closes the {@link EmojiPickerWrapper}. */
export const EmojiToggleBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  flex-shrink: 0;
  transition: color 0.15s ${EASING};

  &:hover {
    color: var(--accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

/** Positions the emoji toggle button and its popover relative to each other. */
export const EmojiPickerAnchor = styled.div`
  position: relative;
  flex-shrink: 0;
`;

/** Row of quick-reaction emoji buttons shown on long-press or right-click. */
export const ReactionBar = styled.div`
  display: flex;
  gap: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 4px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

/** Individual button inside {@link ReactionBar}. */
export const ReactionBarBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.3);
  }
`;

/** Pill badge showing a reaction with its count, highlighted if the current user reacted. */
export const ReactionPill = styled.button<{ $mine: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid ${(p) => (p.$mine ? "var(--accent)" : "var(--border)")};
  background: ${(p) =>
    p.$mine ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface)"};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
`;

/** Absolute-positioned wrapper that places the {@link ReactionBar} above its parent bubble. */
export const ReactionBarWrapper = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  z-index: 20;
`;

/** Flex row of {@link ReactionPill} badges shown below a message bubble. */
export const ReactionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;
