import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40%           { transform: translateY(-6px); }
`;

const pulse = keyframes`
  from { opacity: 0.4; }
  to   { opacity: 1; }
`;

/** Floating toggle button shown in panel mode. */
export const ToggleButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  transition: all 0.25s ${EASING};
  color: #fff;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  }

  @media (max-width: 768px) {
    bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    right: 16px;
  }
`;

/** Semi-transparent backdrop shown when the panel is open in panel mode. */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 999;
`;

/** Main chat container — fixed slide-in panel or full-page content. */
export const ChatPanel = styled.div<{ $open: boolean; $pageMode: boolean }>`
  position: ${({ $pageMode }) => ($pageMode ? "relative" : "fixed")};
  top: ${({ $pageMode }) => ($pageMode ? "auto" : "0")};
  right: ${({ $pageMode }) => ($pageMode ? "auto" : "0")};
  z-index: ${({ $pageMode }) => ($pageMode ? "auto" : "1000")};
  width: ${({ $pageMode }) => ($pageMode ? "100%" : "400px")};
  height: ${({ $pageMode }) => ($pageMode ? "calc(100vh - 80px)" : "100dvh")};
  background: var(--bg-elevated);
  border-left: ${({ $pageMode }) => ($pageMode ? "none" : "1px solid var(--border)")};
  border-radius: ${({ $pageMode }) => ($pageMode ? "12px" : "0")};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${({ $open, $pageMode }) =>
    !$pageMode && !$open ? "translateX(100%)" : "translateX(0)"};
  transition: transform 0.3s ${EASING};
  pointer-events: ${({ $open, $pageMode }) => ($pageMode || $open ? "all" : "none")};
  animation: ${({ $open, $pageMode }) =>
    !$pageMode && $open ? `${slideIn} 0.3s ${EASING}` : "none"};

  @media (max-width: 768px) {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
    border-left: none;
  }
`;

/** Top bar with title and optional close button. */
export const ChatHeader = styled.header`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  span {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text);
  }
`;

/** X close button for panel mode. */
export const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1.4rem;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.2s;
  &:hover { color: var(--text); }
`;

/** Scrollable message area. */
export const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
`;

/** Container for the suggested prompt chips shown when chat is empty. */
export const SuggestedPrompts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
`;

/** Label above the suggested prompts. */
export const SuggestedLabel = styled.p`
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0 0 4px;
`;

/** Clickable prompt suggestion chip. */
export const PromptChip = styled.button`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ${EASING};

  &:hover {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    border-color: var(--accent);
    color: var(--accent);
  }
`;

/** Row wrapper that aligns user messages right and assistant messages left. */
export const MessageRow = styled.div<{ $role: string }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $role }) => ($role === "user" ? "flex-end" : "flex-start")};
  gap: 4px;
`;

/** Individual chat bubble. */
export const MessageBubble = styled.div<{ $role: string }>`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: ${({ $role }) =>
    $role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};
  background: ${({ $role }) => ($role === "user" ? "var(--accent)" : "var(--surface)")};
  color: ${({ $role }) => ($role === "user" ? "#fff" : "var(--text)")};
  border: ${({ $role }) => ($role === "user" ? "none" : "1px solid var(--border)")};
  font-size: 0.875rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
    font-size: 0.82rem;
    white-space: normal;
  }

  th, td {
    border: 1px solid var(--border);
    padding: 6px 10px;
    text-align: left;
  }

  thead th {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    font-weight: 600;
    color: var(--text);
  }

  tbody tr:nth-child(even) {
    background: color-mix(in srgb, var(--accent) 4%, transparent);
  }

  h1, h2, h3 { margin: 6px 0 2px; font-weight: 600; }
  h1 { font-size: 1rem; }
  h2 { font-size: 0.95rem; }
  h3 { font-size: 0.875rem; }

  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; }

  code {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    max-width: 90%;
    table { font-size: 0.75rem; }
    th, td { padding: 4px 6px; }
  }
`;

/** Pill badge shown during tool execution. */
export const ToolStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 20px;
  padding: 4px 10px;
  font-weight: 500;
  align-self: flex-start;
`;

/** Animated three-dot thinking indicator. */
export const ThinkingDots = styled.div`
  display: flex;
  gap: 5px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px 16px 16px 4px;
  width: fit-content;

  span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    animation: ${bounce} 1.2s ease-in-out infinite, ${pulse} 1.2s ease-in-out infinite alternate;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

/** Form bar at the bottom of the chat panel. */
export const ChatInputForm = styled.form`
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

/** Text input field. */
export const ChatInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus { border-color: var(--accent); }
  &::placeholder { color: var(--text-muted); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

/** Send button. */
export const SendButton = styled.button`
  padding: 10px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s ${EASING};

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// ─── History Panel ─────────────────────────────────────────────────────────────

/** Outer wrapper for the two-column chat layout (history + chat area). */
export const ChatLayout = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

/** Left history sidebar — collapsible. */
export const HistoryPanel = styled.aside<{ $expanded: boolean }>`
  width: ${(p) => (p.$expanded ? "240px" : "48px")};
  min-width: ${(p) => (p.$expanded ? "240px" : "48px")};
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.25s ${EASING}, min-width 0.25s ${EASING};
  background: var(--bg);

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 50;
    width: ${(p) => (p.$expanded ? "100%" : "0")};
    min-width: 0;
    border-right: none;
    box-shadow: ${(p) => (p.$expanded ? "4px 0 20px rgba(0,0,0,0.15)" : "none")};
  }
`;

/** Header row of the history panel (toggle + label). */
export const HistoryPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
`;

/** "History" label in the panel header. */
export const HistoryPanelTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
`;

/** Icon button to collapse/expand the history panel. */
export const CollapseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
  transition: all 0.15s ${EASING};
  &:hover { background: var(--surface); color: var(--text); }
  svg { width: 16px; height: 16px; }
`;

/** "New chat" button at the top of the thread list. */
export const NewChatButton = styled.button`
  width: calc(100% - 20px);
  max-width: 220px;
  margin: 10px;
  padding: 8px 12px;

  @media (max-width: 768px) {
    max-width: calc(100% - 20px);
  }
  border: 1px dashed var(--accent);
  border-radius: 8px;
  background: transparent;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ${EASING};
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
`;

/** Scrollable list of threads. */
export const ThreadList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
`;

/** One thread row in the history panel. */
export const ThreadItem = styled.div<{ $active: boolean; $deleting: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  border-left: 3px solid ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  background: ${(p) =>
    p.$deleting
      ? "color-mix(in srgb, var(--danger, #ef4444) 8%, transparent)"
      : p.$active
        ? "color-mix(in srgb, var(--accent) 8%, transparent)"
        : "transparent"};
  transition: all 0.15s ${EASING};
  min-width: 0;

  &:hover {
    background: ${(p) =>
      p.$active
        ? "color-mix(in srgb, var(--accent) 12%, transparent)"
        : "var(--surface)"};
  }

  &:hover .thread-delete { opacity: 1; }
`;

/** Thread title text — 1-line truncated. */
export const ThreadTitle = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Inline input shown when renaming a thread via double-click. */
export const ThreadRenameInput = styled.input`
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  color: var(--text);
  background: var(--bg-elevated);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1px 6px;
  outline: none;
`;

/** Meta row beside the thread title (date + delete). */
export const ThreadMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

/** Relative date label for a thread. */
export const ThreadDate = styled.span`
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
`;

/** Trash icon button on a thread row. */
export const ThreadDeleteBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover { color: var(--danger, #ef4444); }
  svg { width: 14px; height: 14px; }
`;

/** Inline delete confirmation row. */
export const DeleteConfirm = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
`;

/** Confirm or cancel button inside the delete confirmation row. */
export const DeleteConfirmBtn = styled.button<{ $confirm?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  color: ${(p) => (p.$confirm ? "var(--danger, #ef4444)" : "var(--text-muted)")};
  &:hover { background: var(--surface); }
`;

/** Shimmer animation for skeleton thread placeholders. */
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

/** Skeleton placeholder for a thread row while history is loading. */
export const SkeletonThread = styled.div`
  height: 44px;
  margin: 4px 10px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--surface) 0px,
    color-mix(in srgb, var(--accent) 6%, var(--surface)) 40px,
    var(--surface) 80px
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

/** Empty state shown when there are no threads. */
export const EmptyHistory = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  text-align: center;

  p {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }
`;

/** The right-side chat area that sits next to the history panel. */
export const ChatArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

/** Button in the ChatHeader to toggle the history panel on mobile. */
export const HistoryToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.15s ${EASING};
  flex-shrink: 0;
  &:hover { background: var(--surface); color: var(--text); }
  svg { width: 18px; height: 18px; }
`;

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

/** Horizontally wrapping row of follow-up suggestion chips shown after each AI response. */
export const SuggestionChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 12px 10px;
  animation: fadeIn 0.25s ease;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;

/** A single tappable suggestion pill that populates the chat input. */
export const SuggestionChip = styled.button`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.78rem;
  line-height: 1.4;
  padding: 5px 14px;
  transition: background 0.15s ${EASING}, border-color 0.15s ${EASING}, color 0.15s ${EASING};
  white-space: nowrap;
  &:hover {
    background: var(--bg-elevated);
    border-color: var(--accent);
    color: var(--accent);
  }
  @media (max-width: 480px) { font-size: 0.75rem; padding: 4px 11px; }
`;
