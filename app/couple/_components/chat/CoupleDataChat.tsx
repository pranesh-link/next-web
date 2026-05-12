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
} from "./_AiChat.styled";

// ─── CMS Config ───────────────────────────────────────────────────────────────

interface AiChatCms {
  title: string;
  placeholder: string;
  suggestedPrompts: string[];
  toolLabels: Record<string, string>;
}

const DEFAULT_CONFIG: AiChatCms = {
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

function useChatConfig(configEndpoint: string) {
  const [config, setConfig] = useState<AiChatCms>(DEFAULT_CONFIG);
  useEffect(() => {
    fetch(configEndpoint)
      .then((r) => r.json())
      .then((data: AiChatCms) => setConfig(data))
      .catch(() => {/* keep defaults */});
  }, [configEndpoint]);
  return config;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseTableBlock(block: string): string {
  const lines = block.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return block;
  const isSeparator = (line: string) => /^\|[-| :]+\|$/.test(line.trim());
  const parseCells = (line: string, tag: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((c) => `<${tag}>${c.trim()}</${tag}>`)
      .join("");

  const headerLine = lines[0];
  const dataLines = lines.filter((l, i) => i !== 0 && !isSeparator(l));

  const thead = `<thead><tr>${parseCells(headerLine, "th")}</tr></thead>`;
  const tbody = `<tbody>${dataLines.map((l) => `<tr>${parseCells(l, "td")}</tr>`).join("")}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

function renderMarkdown(text: string): string {
  // Extract and replace table blocks before other processing
  const tableBlockRe = /(?:^\|.+\|$\n?){2,}/gm;
  const processed = text.replace(tableBlockRe, (block) => parseTableBlock(block));

  return processed
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // H3
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    // H2
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // H1
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Unordered list items — wrap consecutive ones in <ul>
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Line breaks
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

// ─── SSE Chat Hook ────────────────────────────────────────────────────────────

function useAiChat(endpoint: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
        const history = [...messagesRef.current, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(endpoint, {
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
    [endpoint, isLoading]
  );

  return { messages, input, setInput, isLoading, activeToolCall, sendMessage };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CoupleDataChatProps {
  endpoint: string;
  configEndpoint: string;
  pageMode?: boolean;
}

export default function CoupleDataChat({ endpoint, configEndpoint, pageMode = false }: CoupleDataChatProps) {
  const [isOpen, setIsOpen] = useState(pageMode);
  const bottomRef = useRef<HTMLDivElement>(null);
  const config = useChatConfig(configEndpoint);
  const { messages, input, setInput, isLoading, activeToolCall, sendMessage } = useAiChat(endpoint);

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
        <span>{config.title}</span>
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
              message.role === "assistant" ? (
                <MessageBubble
                  $role={message.role}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                />
              ) : (
                <MessageBubble $role={message.role}>{message.content}</MessageBubble>
              )
            )}
          </MessageRow>
        ))}

        {activeToolCall && (
          <ToolStatus>⚡ {config.toolLabels?.[activeToolCall] ?? "Fetching your data..."}</ToolStatus>
        )}

        {isLoading && !activeToolCall && messages.at(-1)?.content === "" && (
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
          placeholder={config.placeholder}
          disabled={isLoading}
          inputMode="text"
          enterKeyHint="send"
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
        aria-label="Toggle AI chat"
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
