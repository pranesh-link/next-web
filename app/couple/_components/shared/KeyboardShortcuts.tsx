'use client';

import { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Dialog = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  max-width: 440px;
  width: 90%;
  animation: ${scaleIn} 0.2s ease-out;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 20px 0;
`;

const ShortcutList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ShortcutItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Description = styled.span`
  font-size: 14px;
  color: var(--text-muted);
`;

const Key = styled.kbd`
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  font-family: monospace;
  color: var(--text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const CloseHint = styled.p`
  margin: 20px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
`;

const SHORTCUTS = [
  { key: 'n', description: 'Add new transaction' },
  { key: 's', description: 'Focus search' },
  { key: '?', description: 'Show this help' },
  { key: 'Esc', description: 'Close modal / dialog' },
] as const;

/** Props for KeyboardShortcuts — pass callbacks for each shortcut action. */
export interface KeyboardShortcutsProps {
  /** Callback when 'n' is pressed (open add transaction). */
  onAddTransaction?: () => void;
  /** Callback when 's' is pressed (focus search). */
  onFocusSearch?: () => void;
}

/**
 * Global keyboard shortcuts handler for finance pages.
 * Renders a help modal on '?' key press.
 * Only activates when no input/textarea is focused.
 */
export default function KeyboardShortcuts({
  onAddTransaction,
  onFocusSearch,
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'n':
          e.preventDefault();
          onAddTransaction?.();
          break;
        case 's':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case '?':
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;
        case 'Escape':
          e.preventDefault();
          setShowHelp(false);
          break;
      }
    },
    [onAddTransaction, onFocusSearch]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!showHelp) return null;

  return (
    <Overlay onClick={() => setShowHelp(false)}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Title>Keyboard Shortcuts</Title>
        <ShortcutList>
          {SHORTCUTS.map(({ key, description }) => (
            <ShortcutItem key={key}>
              <Description>{description}</Description>
              <Key>{key}</Key>
            </ShortcutItem>
          ))}
        </ShortcutList>
        <CloseHint>Press Esc or ? to close</CloseHint>
      </Dialog>
    </Overlay>
  );
}
