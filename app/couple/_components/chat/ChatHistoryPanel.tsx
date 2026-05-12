"use client";

import { useState, useRef, useCallback } from "react";
import {
  HistoryPanel,
  HistoryPanelHeader,
  HistoryPanelTitle,
  CollapseButton,
  NewChatButton,
  ThreadList,
  ThreadItem,
  ThreadTitle,
  ThreadRenameInput,
  ThreadMeta,
  ThreadDate,
  ThreadDeleteBtn,
  DeleteConfirm,
  DeleteConfirmBtn,
  SkeletonThread,
  EmptyHistory,
} from "./_AiChat.styled";
import type { ChatThread } from "./_useChatHistory";

/** Converts an ISO date string to a human-readable relative label. */
function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Props for a single thread row. */
interface ThreadRowProps {
  thread: ChatThread;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

/** Renders one thread row with inline delete-confirm and double-click rename. */
function ThreadRow({ thread, isActive, onSelect, onDelete, onRename }: ThreadRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    setEditTitle(thread.title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [thread.title]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== thread.title) onRename(thread.id, trimmed);
  }, [editTitle, thread.id, thread.title, onRename]);

  return (
    <ThreadItem
      $active={isActive}
      $deleting={isDeleting}
      onClick={() => !isEditing && onSelect(thread.id)}
    >
      {isEditing ? (
        <ThreadRenameInput
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setIsEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <ThreadTitle onDoubleClick={startEdit}>{thread.title}</ThreadTitle>
      )}
      <ThreadMeta>
        {isDeleting ? (
          <DeleteConfirm onClick={(e) => e.stopPropagation()}>
            <DeleteConfirmBtn $confirm onClick={() => onDelete(thread.id)}>
              ✓
            </DeleteConfirmBtn>
            <DeleteConfirmBtn onClick={() => setIsDeleting(false)}>✗</DeleteConfirmBtn>
          </DeleteConfirm>
        ) : (
          <>
            <ThreadDate>{relativeDate(thread.updatedAt)}</ThreadDate>
            <ThreadDeleteBtn
              className="thread-delete"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleting(true);
              }}
              aria-label="Delete thread"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
              </svg>
            </ThreadDeleteBtn>
          </>
        )}
      </ThreadMeta>
    </ThreadItem>
  );
}

/** Props for the ChatHistoryPanel component. */
interface ChatHistoryPanelProps {
  /** List of chat threads to display. */
  threads: ChatThread[];
  /** ID of the currently active thread, or null if none is selected. */
  activeThreadId: string | null;
  /** Whether the thread list is currently being fetched. */
  isLoading: boolean;
  /** Whether the panel is in the expanded (full-width) or collapsed (rail) state. */
  expanded: boolean;
  /** Called when the user clicks the expand/collapse toggle. */
  onToggleExpand: () => void;
  /** Called when the user selects a thread from the list. */
  onSelectThread: (id: string) => void;
  /** Called when the user clicks "New chat". */
  onNewChat: () => void;
  /** Called when the user confirms deleting a thread. */
  onDeleteThread: (id: string) => void;
  /** Called when the user renames a thread. */
  onRenameThread: (id: string, title: string) => void;
}

/**
 * Left history sidebar showing past chat threads with collapse,
 * new-chat, and per-thread delete/rename controls.
 *
 * @param props - See {@link ChatHistoryPanelProps}.
 */
export default function ChatHistoryPanel({
  threads,
  activeThreadId,
  isLoading,
  expanded,
  onToggleExpand,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
}: ChatHistoryPanelProps) {
  const showEmpty = !isLoading && threads.length === 0;

  return (
    <HistoryPanel $expanded={expanded}>
      <HistoryPanelHeader>
        <CollapseButton
          onClick={onToggleExpand}
          aria-label={expanded ? "Collapse history" : "Expand history"}
        >
          {expanded ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </CollapseButton>
        <HistoryPanelTitle>History</HistoryPanelTitle>
      </HistoryPanelHeader>

      {expanded && (
        <NewChatButton onClick={onNewChat} aria-label="New chat">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
          New chat
        </NewChatButton>
      )}

      {expanded && (
        <ThreadList>
          {isLoading && threads.length === 0 && (
            <>
              <SkeletonThread />
              <SkeletonThread />
              <SkeletonThread />
            </>
          )}
          {threads.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onSelect={onSelectThread}
              onDelete={onDeleteThread}
              onRename={onRenameThread}
            />
          ))}
          {showEmpty && (
            <EmptyHistory>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width={24}
                height={24}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" />
              </svg>
              <p>
                No past conversations yet.
                <br />
                Start a new chat above.
              </p>
            </EmptyHistory>
          )}
        </ThreadList>
      )}
    </HistoryPanel>
  );
}
