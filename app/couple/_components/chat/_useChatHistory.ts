"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Shape of a single chat thread returned from the history API.
 */
export interface ChatThread {
  /** Unique thread identifier. */
  id: string;
  /** Display title of the thread. */
  title: string;
  /** ISO timestamp of the last update. */
  updatedAt: string;
  /** Preview of the last message, or null if empty. */
  lastMessage: string | null;
}

/**
 * Shape of a single chat message returned by {@link useChatHistory.loadThreadMessages}.
 */
export interface ThreadMessage {
  /** Unique message identifier. */
  id: string;
  /** Who sent the message. */
  role: "user" | "assistant";
  /** Message content. */
  content: string;
}

/**
 * Manages chat thread history: listing, selecting, deleting, and renaming threads.
 * Persists the sidebar's expanded state in localStorage under `chatHistoryExpanded`.
 *
 * @returns Stateful helpers for the chat history panel.
 * @example
 * ```tsx
 * const { threads, activeThreadId, setActiveThreadId, historyExpanded, setHistoryExpanded } = useChatHistory();
 * ```
 */
export function useChatHistory(): {
  threads: ChatThread[];
  activeThreadId: string | null;
  isLoading: boolean;
  historyExpanded: boolean;
  setActiveThreadId: (id: string | null) => void;
  setHistoryExpanded: (v: boolean) => void;
  loadThreadMessages: (chatId: string) => Promise<ThreadMessage[]>;
  deleteThread: (chatId: string) => Promise<void>;
  renameThread: (chatId: string, title: string) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyExpanded, setHistoryExpandedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("chatHistoryExpanded") !== "false";
  });

  /**
   * Persists the expanded state to localStorage on every change.
   *
   * @param v - Whether the history panel should be expanded.
   */
  const setHistoryExpanded = useCallback((v: boolean) => {
    setHistoryExpandedState(v);
    localStorage.setItem("chatHistoryExpanded", String(v));
  }, []);

  /**
   * Fetches all threads from the API and refreshes local state.
   *
   * @returns Promise that resolves when the fetch completes.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/couple/chats");
      if (!res.ok) return;
      const data = (await res.json()) as ChatThread[];
      setThreads(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches all messages for a given chat thread.
   *
   * @param chatId - The thread ID to load messages for.
   * @returns Array of messages, empty on error.
   */
  const loadThreadMessages = useCallback(
    async (chatId: string): Promise<ThreadMessage[]> => {
      const res = await fetch(`/api/v1/couple/chats/${chatId}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { messages?: ThreadMessage[] };
      return (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
    },
    []
  );

  /**
   * Optimistically removes a thread and sends a DELETE request.
   * If the deleted thread was active, advances to the next thread.
   *
   * @param chatId - The thread ID to delete.
   */
  const deleteThread = useCallback(
    async (chatId: string) => {
      const remaining = threads.filter((t) => t.id !== chatId);
      setThreads(remaining);
      if (activeThreadId === chatId) {
        setActiveThreadId(remaining[0]?.id ?? null);
      }
      await fetch(`/api/v1/couple/chats/${chatId}`, { method: "DELETE" });
    },
    [threads, activeThreadId]
  );

  /**
   * Optimistically updates a thread's title and sends a PATCH request.
   *
   * @param chatId - The thread ID to rename.
   * @param title  - The new display title.
   */
  const renameThread = useCallback(async (chatId: string, title: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === chatId ? { ...t, title } : t))
    );
    await fetch(`/api/v1/couple/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    threads,
    activeThreadId,
    isLoading,
    historyExpanded,
    setActiveThreadId,
    setHistoryExpanded,
    loadThreadMessages,
    deleteThread,
    renameThread,
    refresh,
  };
}
