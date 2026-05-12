"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  ToggleButton, Overlay, ChatPanel, ChatHeader, CloseButton,
  MessageList, SuggestedPrompts, SuggestedLabel, PromptChip,
  MessageRow, MessageBubble, ToolStatus, ThinkingDots,
  ChatInputForm, ChatInput, SendButton,
  ChatLayout, ChatArea, HistoryToggleButton,
  SuggestionChips, SuggestionChip,
} from "./_AiChat.styled";
import { useChatConfig, renderMarkdown } from "./_chat-utils";
import { useChatHistory } from "./_useChatHistory";
import ChatHistoryPanel from "./ChatHistoryPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single message in the AI chat conversation. */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ─── SSE Chat Hook ────────────────────────────────────────────────────────────

/**
 * Manages AI chat state: messages, loading, tool calls, and chat thread ID.
 *
 * @param endpoint - The SSE POST endpoint for the AI chat.
 * @returns Chat state and action handlers.
 */
function useAiChat(endpoint: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const chatIdRef = useRef<string | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { chatIdRef.current = currentChatId; }, [currentChatId]);

  /** Replace all messages (used when switching threads). */
  const loadMessages = useCallback((msgs: ChatMessage[]) => setMessages(msgs), []);

  /** Clear messages and thread ID to start a fresh conversation. */
  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    chatIdRef.current = null;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);
    setActiveToolCall(null);
    setSuggestions([]);

    try {
      const history = [...messagesRef.current, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, chatId: chatIdRef.current }),
      });
      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let event: { type: string; toolName?: string; delta?: string; message?: string; chatId?: string; suggestions?: string[] };
          try { event = JSON.parse(raw) as typeof event; } catch { continue; }
          if (event.type === "tool_call") {
            setActiveToolCall(event.toolName ?? null);
          } else if (event.type === "text_delta" && event.delta) {
            accumulated += event.delta;
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m));
            setActiveToolCall(null);
          } else if (event.type === "done") {
            if (event.chatId) { setCurrentChatId(event.chatId); chatIdRef.current = event.chatId; }
            if (event.suggestions?.length) setSuggestions(event.suggestions);
            setActiveToolCall(null);
          } else if (event.type === "error") {
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m));
          }
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.role === "assistant" && m.content === "" ? { ...m, content: "Sorry, something went wrong. Please try again." } : m));
    } finally {
      setIsLoading(false);
      setActiveToolCall(null);
    }
  }, [endpoint, isLoading]);

  return { messages, input, setInput, isLoading, activeToolCall, suggestions, setSuggestions, sendMessage, currentChatId, setCurrentChatId, resetChat, loadMessages };
}

// ─── Component ────────────────────────────────────────────────────────────────

/** Props for {@link CoupleDataChat}. */
interface CoupleDataChatProps {
  /** SSE POST endpoint for the AI assistant. */
  endpoint: string;
  /** JSON endpoint for CMS config (title, prompts, tool labels). */
  configEndpoint: string;
  /** When true renders inline (full-page). When false renders as a floating panel. */
  pageMode?: boolean;
}

/**
 * AI chat panel with history sidebar for "Chat with your Couple data".
 *
 * @param props - See {@link CoupleDataChatProps}.
 */
export default function CoupleDataChat({ endpoint, configEndpoint, pageMode = false }: CoupleDataChatProps) {
  const [isOpen, setIsOpen] = useState(pageMode);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const config = useChatConfig(configEndpoint);
  const { messages, input, setInput, isLoading, activeToolCall, suggestions, setSuggestions, sendMessage, currentChatId, setCurrentChatId, resetChat, loadMessages } = useAiChat(endpoint);
  const { threads, activeThreadId, isLoading: historyLoading, historyExpanded, setActiveThreadId, setHistoryExpanded, loadThreadMessages, deleteThread, renameThread, refresh } = useChatHistory();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeToolCall]);

  // Sync new chat ID back to history list after first message creates a thread
  useEffect(() => {
    if (currentChatId && currentChatId !== activeThreadId) {
      setActiveThreadId(currentChatId);
      void refresh();
    }
  }, [currentChatId, activeThreadId, setActiveThreadId, refresh]);

  const handleSelectThread = useCallback(async (chatId: string) => {
    const msgs = await loadThreadMessages(chatId);
    loadMessages(msgs.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    setActiveThreadId(chatId);
    setCurrentChatId(chatId);
    setMobileHistoryOpen(false);
  }, [loadThreadMessages, loadMessages, setActiveThreadId, setCurrentChatId]);

  const handleNewChat = useCallback(() => {
    resetChat();
    setSuggestions([]);
    setActiveThreadId(null);
    setMobileHistoryOpen(false);
  }, [resetChat, setSuggestions, setActiveThreadId]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); void sendMessage(input); };

  const historyPanel = (
    <ChatHistoryPanel
      threads={threads}
      activeThreadId={activeThreadId}
      isLoading={historyLoading}
      expanded={historyExpanded}
      onToggleExpand={() => setHistoryExpanded(!historyExpanded)}
      onSelectThread={(id) => void handleSelectThread(id)}
      onNewChat={handleNewChat}
      onDeleteThread={(id) => void deleteThread(id)}
      onRenameThread={(id, title) => void renameThread(id, title)}
    />
  );

  const chatBody = (
    <ChatArea>
      <ChatHeader>
        <HistoryToggleButton onClick={() => setMobileHistoryOpen(true)} aria-label="Open chat history">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </HistoryToggleButton>
        <span>{config.title}</span>
        {!pageMode && <CloseButton onClick={() => setIsOpen(false)} aria-label="Close chat">×</CloseButton>}
      </ChatHeader>
      <MessageList>
        {messages.length === 0 && (
          <SuggestedPrompts>
            <SuggestedLabel>Try asking:</SuggestedLabel>
            {config.suggestedPrompts.map((p) => (
              <PromptChip key={p} onClick={() => void sendMessage(p)}>{p}</PromptChip>
            ))}
          </SuggestedPrompts>
        )}
        {messages.map((message) => (
          <MessageRow key={message.id} $role={message.role}>
            {message.content && (
              message.role === "assistant"
                ? <MessageBubble $role={message.role} dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                : <MessageBubble $role={message.role}>{message.content}</MessageBubble>
            )}
          </MessageRow>
        ))}
        {!isLoading && suggestions.length > 0 && (
          <SuggestionChips>
            {suggestions.map((s) => (
              <SuggestionChip key={s} onClick={() => setInput(s)}>{s}</SuggestionChip>
            ))}
          </SuggestionChips>
        )}
        {activeToolCall && <ToolStatus>⚡ {config.toolLabels?.[activeToolCall] ?? "Fetching your data..."}</ToolStatus>}
        {isLoading && !activeToolCall && messages.at(-1)?.content === "" && (
          <ThinkingDots><span /><span /><span /></ThinkingDots>
        )}
        <div ref={bottomRef} />
      </MessageList>
      <ChatInputForm onSubmit={handleSubmit}>
        <ChatInput value={input} onChange={(e) => setInput(e.target.value)} placeholder={config.placeholder} disabled={isLoading} inputMode="text" enterKeyHint="send" />
        <SendButton type="submit" disabled={isLoading || !input.trim()}>Send</SendButton>
      </ChatInputForm>
    </ChatArea>
  );

  const panel = (
    <ChatPanel $open={isOpen} $pageMode={pageMode}>
      <ChatLayout>
        {historyPanel}
        {mobileHistoryOpen && <Overlay onClick={() => setMobileHistoryOpen(false)} />}
        {chatBody}
      </ChatLayout>
    </ChatPanel>
  );

  if (pageMode) return panel;

  return (
    <>
      <ToggleButton onClick={() => setIsOpen((v) => !v)} $isOpen={isOpen} aria-label="Toggle AI chat">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </ToggleButton>
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}
      {panel}
    </>
  );
}
