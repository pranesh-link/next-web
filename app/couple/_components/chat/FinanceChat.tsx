"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  ToggleButton,
  Overlay,
  ChatPanel,
  ChatHeader,
  CloseButton,
  MessageList,
  SuggestedPrompts,
  SuggestedLabel,
  PromptChip,
  MessageRow,
  MessageBubble,
  ToolStatus,
  ThinkingDots,
  ChatInputForm,
  ChatInput,
  SendButton,
} from "./_FinanceChat.styled";

// ─── CMS Config ───────────────────────────────────────────────────────────────

interface FinanceChatCms {
  title: string;
  placeholder: string;
  suggestedPrompts: string[];
  toolLabels: Record<string, string>;
}

const DEFAULT_CONFIG: FinanceChatCms = {
  title: "AI Finance Assistant",
  placeholder: "Ask about your finances...",
  suggestedPrompts: [
    "How much did I spend this month?",
    "What's my net worth?",
    "Show my budget status for this month",
    "Which category am I overspending on?",
  ],
  toolLabels: {},
};

function useFinanceChatConfig() {
  const [config, setConfig] = useState<FinanceChatCms>(DEFAULT_CONFIG);
  useEffect(() => {
    fetch("/api/finance/chat/config")
      .then((r) => r.json())
      .then((data: FinanceChatCms) => setConfig(data))
      .catch(() => {/* keep defaults */});
  }, []);
  return config;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ─── SSE Chat Hook ────────────────────────────────────────────────────────────

function useFinanceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setInput("");
      setIsLoading(true);
      setActiveToolCall(null);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/finance/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok || !res.body) throw new Error("Chat request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

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

            let event: { type: string; toolName?: string; delta?: string; message?: string };
            try {
              event = JSON.parse(raw) as typeof event;
            } catch {
              continue;
            }

            if (event.type === "tool_call") {
              setActiveToolCall(event.toolName ?? null);
            } else if (event.type === "text_delta" && event.delta) {
              accumulated += event.delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
              setActiveToolCall(null);
            } else if (event.type === "done") {
              setActiveToolCall(null);
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: "Sorry, something went wrong. Please try again." }
                    : m
                )
              );
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.role === "assistant" && m.content === ""
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        setActiveToolCall(null);
      }
    },
    [messages, isLoading]
  );

  return { messages, input, setInput, isLoading, activeToolCall, sendMessage };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FinanceChatProps {
  /** When true, renders inline as full-page content instead of a floating panel. */
  pageMode?: boolean;
}

export default function FinanceChat({ pageMode = false }: FinanceChatProps) {
  const [isOpen, setIsOpen] = useState(pageMode);
  const bottomRef = useRef<HTMLDivElement>(null);
  const config = useFinanceChatConfig();
  const { messages, input, setInput, isLoading, activeToolCall, sendMessage } = useFinanceChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeToolCall]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const panel = (
    <ChatPanel $open={isOpen} $pageMode={pageMode}>
      <ChatHeader>
        <span>AI Finance Assistant</span>
        {!pageMode && (
          <CloseButton onClick={() => setIsOpen(false)} aria-label="Close chat">
            ×
          </CloseButton>
        )}
      </ChatHeader>

      <MessageList>
        {messages.length === 0 && (
          <SuggestedPrompts>
            <SuggestedLabel>Try asking:</SuggestedLabel>
            {config.suggestedPrompts.map((p) => (
              <PromptChip key={p} onClick={() => void sendMessage(p)}>
                {p}
              </PromptChip>
            ))}
          </SuggestedPrompts>
        )}

        {messages.map((message) => (
          <MessageRow key={message.id} $role={message.role}>
            {message.content && (
              <MessageBubble $role={message.role}>{message.content}</MessageBubble>
            )}
          </MessageRow>
        ))}

        {activeToolCall && (
          <ToolStatus>{config.toolLabels[activeToolCall] ?? "Fetching your data..."}</ToolStatus>
        )}

        {isLoading && !activeToolCall && messages.at(-1)?.role === "user" && (
          <ThinkingDots>
            <span />
            <span />
            <span />
          </ThinkingDots>
        )}

        <div ref={bottomRef} />
      </MessageList>

      <ChatInputForm onSubmit={handleSubmit}>
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          disabled={isLoading}
        />
        <SendButton type="submit" disabled={isLoading || !input.trim()}>
          Send
        </SendButton>
      </ChatInputForm>
    </ChatPanel>
  );

  if (pageMode) return panel;

  return (
    <>
      <ToggleButton
        onClick={() => setIsOpen((v) => !v)}
        $isOpen={isOpen}
        aria-label="Toggle AI finance chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </ToggleButton>
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}
      {panel}
    </>
  );
}
