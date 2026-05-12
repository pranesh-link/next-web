/**
 * POST /api/couple/data-chat
 *
 * Streams an SSE response for the "Chat with your Couple data" AI assistant.
 * Uses OpenAI-compatible API (OpenRouter + DeepSeek) with a tool-calling
 * agentic loop — combines finance and lifestyle tools.
 *
 * SSE event shapes:
 *   {"type":"tool_call","toolName":"getNutritionSummary"}
 *   {"type":"text_delta","delta":"Your nutrition..."}
 *   {"type":"done"}
 *   {"type":"error","message":"..."}
 */

import path from "path";
import fs from "fs";
import OpenAI from "openai";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { auth } from "@/_lib/auth";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { NL_TO_SQL_TOOL, NL_TO_SQL_TOOL_LABELS, validateAndExecuteQuery } from "@/couple/_lib/nl-to-sql-tool";
import { extractSchemaForPrompt } from "@/couple/_lib/schema-extractor";

export const maxDuration = 60;

interface CoupleDataChatCms {
  systemPrompt: string;
}

function loadCmsChatConfig(): CoupleDataChatCms {
  const filePath = path.join(process.cwd(), "data", "cms", "couple-data-chat.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as CoupleDataChatCms;
}

type ChatMessage = {
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ChatCompletionMessageToolCall[];
};

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };

  const coupleUserIds = await getUserIdsForCouple(session.user.id);
  const { systemPrompt } = loadCmsChatConfig();

  const today = new Date().toISOString().split("T")[0];
  const schema = extractSchemaForPrompt();
  const userIdList = coupleUserIds.map((id) => `'${id}'`).join(", ");
  const enrichedSystemPrompt = `${systemPrompt}

Today's date: ${today}.

Couple member user IDs (MUST be used in every query):
${userIdList}

MANDATORY: Every SQL query MUST include WHERE "userId" IN (${userIdList}) — no exceptions. Never omit this filter.

${schema}

SQL Rules:
- Only SELECT queries
- Always double-quote camelCase column names: "userId", "createdAt", "updatedAt", etc.
- Table names are snake_case as listed in the schema above
- Use DATE_TRUNC('month', date) for monthly grouping
- Use DATE_TRUNC('week', date) for weekly grouping
- Add LIMIT 100 if not specified
- For amounts: SUM, AVG, MIN, MAX are fine
- For dates: compare using >= and < boundaries
- Current month start: DATE_TRUNC('month', CURRENT_DATE)
- Last month start: DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'`;

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
  });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Build the message history for the agentic loop
        const current: ChatMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Agentic loop — max 5 tool-call rounds to prevent runaway
        let answered = false;
        for (let step = 0; step < 5; step++) {
          const completion = await client.chat.completions.create({
            model: "deepseek/deepseek-chat",
            messages: [{ role: "system", content: enrichedSystemPrompt }, ...current] as Parameters<typeof client.chat.completions.create>[0]["messages"],
            // eslint-disable -- tools cast required for openai SDK
            tools: NL_TO_SQL_TOOL as Parameters<typeof client.chat.completions.create>[0]["tools"],
            tool_choice: "auto",
            stream: false,
          });

          const choice = completion.choices[0];
          const msg = choice.message;

          if (choice.finish_reason === "tool_calls" && msg.tool_calls?.length) {
            // Push assistant message with tool_calls into history
            current.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });

            for (const toolCall of msg.tool_calls) {
              if (!("function" in toolCall)) continue;

              let result: unknown;
              try {
                const args = JSON.parse(toolCall.function.arguments ?? "{}") as Record<string, unknown>;
                if (toolCall.function.name === "executeQuery") {
                  const { query, explanation } = args as { query: string; explanation?: string };
                  send({ type: "tool_call", toolName: "executeQuery", label: explanation ?? NL_TO_SQL_TOOL_LABELS.executeQuery });
                  const { rows, error } = await validateAndExecuteQuery(query, coupleUserIds);
                  result = error ? { error } : rows;
                } else {
                  result = { error: `Unknown tool: ${toolCall.function.name}` };
                }
              } catch {
                result = { error: "Tool execution failed" };
              }

              current.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              });
            }
            // Continue loop to get the next model response
          } else {
            // Fix 2: Send full content as a single delta (no word-by-word streaming)
            const content = msg.content ?? "";
            send({ type: "text_delta", delta: content });
            answered = true;
            break;
          }
        }

        // Fix 3: Loop exhaustion fallback — model never produced a final answer
        if (!answered) {
          send({
            type: "text_delta",
            delta: "I gathered your data but couldn't formulate a response. Please try rephrasing your question.",
          });
        }

        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
