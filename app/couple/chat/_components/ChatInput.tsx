"use client";

import { useState, type FormEvent } from "react";
import { InputWrapper, TypeSelect, MessageInput, SendButton } from "./_chat.styled";

/** Supported user-selectable message types. */
const SELECTABLE_TYPES = ["TEXT", "LIST", "REMINDER"] as const;

/** Props for {@link ChatInput}. */
interface ChatInputProps {
  /** Called when the user submits a message. */
  onSend: (content: string, type: string) => Promise<void>;
  /** Whether a send is in progress. */
  disabled?: boolean;
}

/**
 * Chat input bar with a type selector, text field, and send button.
 *
 * @param onSend - Async callback invoked with the trimmed content and type string.
 * @param disabled - Disables the form while a send is in progress.
 * @returns JSX for the sticky bottom input bar.
 */
export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("TEXT");
  const [sending, setSending] = useState(false);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <InputWrapper onSubmit={handleSubmit}>
      <TypeSelect
        value={type}
        onChange={(e) => setType(e.target.value)}
        disabled={disabled || sending}
        aria-label="Message type"
      >
        {SELECTABLE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t === "TEXT" ? "Text" : t === "LIST" ? "List" : "Reminder"}
          </option>
        ))}
      </TypeSelect>

      <MessageInput
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          type === "LIST"
            ? "One item per line…"
            : type === "REMINDER"
              ? "Set a reminder…"
              : "Type a message…"
        }
        disabled={disabled || sending}
        autoComplete="off"
        aria-label="Message content"
      />

      <SendButton type="submit" disabled={disabled || sending || !content.trim()} aria-label="Send">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </SendButton>
    </InputWrapper>
  );
}
