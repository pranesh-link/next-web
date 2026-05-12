"use client";

import { useEffect, useRef, forwardRef } from "react";
import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Props for {@link AutoResizeTextarea}. */
interface AutoResizeTextareaProps {
  /** Controlled text value. */
  value: string;
  /** Change handler for the textarea. */
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Optional key-down handler. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Placeholder text shown when empty. */
  placeholder?: string;
  /** Whether the textarea is disabled. */
  disabled?: boolean;
  /** Maximum number of visible rows before scrolling. Defaults to 5. */
  maxRows?: number;
  /** Mobile keyboard input mode hint. */
  inputMode?: React.HTMLAttributes<HTMLTextAreaElement>["inputMode"];
  /** Virtual keyboard Enter key label hint. */
  enterKeyHint?: React.HTMLAttributes<HTMLTextAreaElement>["enterKeyHint"];
  /** Accessible label for screen readers. */
  "aria-label"?: string;
}

const LINE_HEIGHT = 22;
const DEFAULT_MAX_ROWS = 5;

/**
 * Base styled textarea — exported so callers can extend it with `styled(TextareaBase)`.
 */
export const TextareaBase = styled.textarea`
  flex: 1;
  min-width: 0;
  resize: none;
  overflow-y: auto;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s ${EASING};
  min-height: 42px;

  &:focus {
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

/**
 * Auto-resizing textarea that grows with content up to `maxRows` visible lines.
 *
 * Exposes {@link TextareaBase} as a named export for styled-component extension.
 * Uses `forwardRef` so callers can attach a ref for imperative focus control.
 *
 * @param value - Controlled text value.
 * @param onChange - Change handler.
 * @param onKeyDown - Optional key-down handler.
 * @param placeholder - Placeholder text.
 * @param disabled - Disables the textarea.
 * @param maxRows - Maximum visible rows before scroll (default: 5).
 * @param inputMode - Mobile keyboard type hint.
 * @param enterKeyHint - Virtual keyboard Enter key label.
 * @param aria-label - Accessible label.
 * @returns A styled auto-resizing `<textarea>` element.
 */
const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  function AutoResizeTextarea(
    {
      value,
      onChange,
      onKeyDown,
      placeholder,
      disabled,
      maxRows = DEFAULT_MAX_ROWS,
      inputMode,
      enterKeyHint,
      "aria-label": ariaLabel,
    },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, maxRows * LINE_HEIGHT) + "px";
    }, [value, maxRows]);

    return (
      <TextareaBase
        ref={(node) => {
          (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }
        }}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        aria-label={ariaLabel}
        rows={1}
      />
    );
  },
);

export default AutoResizeTextarea;
