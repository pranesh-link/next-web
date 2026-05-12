"use client";

import { useState, useEffect } from "react";

// ─── CMS Config ───────────────────────────────────────────────────────────────

/** CMS-driven configuration for the AI chat panel. */
export interface AiChatCms {
  /** Panel title shown in the header. */
  title: string;
  /** Placeholder text for the input field. */
  placeholder: string;
  /** Suggested prompt chips shown on empty state. */
  suggestedPrompts: string[];
  /** Human-readable labels for each tool name. */
  toolLabels: Record<string, string>;
}

/** Fallback config used before the CMS response arrives. */
export const DEFAULT_CONFIG: AiChatCms = {
  title: "Chat with Couple data",
  placeholder: "Ask about your finances, meals, workouts...",
  suggestedPrompts: [
    "How much did we spend last month?",
    "What's our net worth?",
    "Show our meals this week",
    "How are we sleeping?",
  ],
  toolLabels: {},
};

/**
 * Fetches CMS configuration from the given endpoint.
 * Falls back to DEFAULT_CONFIG on error.
 *
 * @param configEndpoint - URL to fetch the CMS config JSON from.
 * @returns Current AiChatCms config.
 */
export function useChatConfig(configEndpoint: string): AiChatCms {
  const [config, setConfig] = useState<AiChatCms>(DEFAULT_CONFIG);
  useEffect(() => {
    fetch(configEndpoint)
      .then((r) => r.json())
      .then((data: AiChatCms) => setConfig(data))
      .catch(() => {/* keep defaults */});
  }, [configEndpoint]);
  return config;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

/**
 * Parse a markdown table block into an HTML table with thead/tbody.
 *
 * @param block - Raw markdown block containing pipe-delimited rows.
 * @returns HTML string with `<table><thead>…</thead><tbody>…</tbody></table>`.
 */
export function parseTableBlock(block: string): string {
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

/**
 * Convert a subset of Markdown to HTML for display in chat bubbles.
 *
 * @param text - Raw markdown string from the LLM.
 * @returns HTML string safe for `dangerouslySetInnerHTML`.
 */
export function renderMarkdown(text: string): string {
  const tableBlockRe = /(?:^\|.+\|$\n?){2,}/gm;
  const processed = text.replace(tableBlockRe, (block) => parseTableBlock(block));
  return processed
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
