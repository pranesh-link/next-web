"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import AutoResizeTextarea from "@/couple/_components/shared/AutoResizeTextarea";
import { InputWrapper, SendButton } from "./_chat.styled";
import {
  TypeToggleBar,
  TypeToggleBtn,
  EmojiPickerWrapper,
  EmojiBtn,
  EmojiToggleBtn,
  EmojiPickerAnchor,
} from "./_chat-extras.styled";

/** Emoji characters available in the picker. */
const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😊", "😎", "🤔", "😅", "😭", "😡",
  "👍", "👎", "❤️", "🔥", "💯", "🎉", "🙌", "👋", "🤝", "✅",
  "❌", "⚡", "🌟", "💪", "🎯", "🚀", "💡", "📋", "🔔", "💬",
  "😘", "🥹", "😴", "🤣", "😱", "🤗", "😜", "🙃", "🫡", "🫶",
];

/** Type toggle options with display labels. */
const TYPE_OPTIONS = [
  { value: "TEXT", label: "💬 Text" },
  { value: "LIST", label: "📋 List" },
  { value: "REMINDER", label: "🔔 Reminder" },
] as const;

/** Placeholder text indexed by message type. */
const TYPE_PLACEHOLDERS: Record<string, string> = {
  TEXT: "Type a message…",
  LIST: "One item per line…",
  REMINDER: "Set a reminder…",
};

/** Props for {@link ChatInput}. */
interface ChatInputProps {
  /** Called when the user submits a message. */
  onSend: (content: string, type: string) => Promise<void>;
  /** Disables the entire form while a send is in progress. */
  disabled?: boolean;
}

/**
 * Chat input bar with type toggle buttons, an auto-resizing textarea,
 * an emoji picker, and a send button.
 *
 * Sends on `Enter` (without Shift) or `Cmd/Ctrl+Enter`.
 *
 * @param onSend - Async callback invoked with trimmed content and type string.
 * @param disabled - Disables the entire form.
 * @returns JSX for the sticky bottom input bar.
 */
export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("TEXT");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiAnchorRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmoji) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiAnchorRef.current && !emojiAnchorRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed, type);
      setContent("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isSend =
      (e.key === "Enter" && !e.shiftKey) ||
      (e.key === "Enter" && (e.metaKey || e.ctrlKey));
    if (isSend) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const isDisabled = disabled || sending;

  return (
    <InputWrapper onSubmit={handleSubmit}>
      <TypeToggleBar>
        {TYPE_OPTIONS.map((opt) => (
          <TypeToggleBtn
            key={opt.value}
            type="button"
            $active={type === opt.value}
            onClick={() => setType(opt.value)}
            disabled={isDisabled}
          >
            {opt.label}
          </TypeToggleBtn>
        ))}
      </TypeToggleBar>

      <AutoResizeTextarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={TYPE_PLACEHOLDERS[type] ?? "Type a message…"}
        disabled={isDisabled}
        inputMode="text"
        enterKeyHint="send"
        aria-label="Message content"
      />

      <EmojiPickerAnchor ref={emojiAnchorRef}>
        <EmojiToggleBtn
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          disabled={isDisabled}
          aria-label="Open emoji picker"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </EmojiToggleBtn>

        {showEmoji && (
          <EmojiPickerWrapper>
            {EMOJIS.map((emoji) => (
              <EmojiBtn
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                aria-label={emoji}
              >
                {emoji}
              </EmojiBtn>
            ))}
          </EmojiPickerWrapper>
        )}
      </EmojiPickerAnchor>

      <SendButton
        type="submit"
        disabled={isDisabled || !content.trim()}
        aria-label="Send"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </SendButton>
    </InputWrapper>
  );
}
