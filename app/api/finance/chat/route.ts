/**
 * POST /api/finance/chat
 *
 * Streams an SSE response for the Finance AI assistant.
 * Uses OpenAI-compatible API (OpenRouter + DeepSeek) with a tool-calling
 * agentic loop — no external AI SDK required.
 *
 * SSE event shapes:
 *   {"type":"tool_call","toolName":"getSpendingByCategory"}
 *   {"type":"text_delta","delta":"Your spending..."}
 *   {"type":"done"}
 *   {"type":"error","message":"..."}
 */

import path from "path";
import fs from "fs";
import OpenAI from "openai";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { auth } from "@/_lib/auth";
import { db } from "@db";
import { users } from "@db/schema";
import { inArray } from "drizzle-orm";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { FINANCE_TOOLS, executeToolCall } from "@/couple/finance/_lib/chat-tools";

export const maxDuration = 60;

interface FinanceChatCms {
  systemPrompt: string;
}

function loadCmsChatConfig(): FinanceChatCms {
  const filePath = path.join(process.cwd(), "data", "cms", "finance-chat.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as FinanceChatCms;
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

  // Fetch real names so the LLM never says "Person 1" / "Person 2"
  const members = await db.query.users.findMany({
    where: inArray(users.id, coupleUserIds),
    columns: { id: true, name: true, email: true },
  });
  const memberNames = members.map((m) => `  '${m.id}' → ${m.name ?? m.email}`).join("\n");

  const today = new Date().toISOString().split("T")[0];
  const enrichedSystemPrompt = `${systemPrompt}

Today's date: ${today}. When the user asks about "last month", "this month", "last week", or similar, derive the correct YYYY-MM from today's date and call the appropriate tool with that value. Do not guess or fabricate dates.

Couple member user IDs and their real names (ALWAYS use these names — never say "Person 1" or "Person 2"):
${memberNames}

TransactionType enum values are exactly: 'INCOME' and 'EXPENSE' (uppercase). Always use uppercase in WHERE clauses.`;

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
        for (let step = 0; step < 5; step++) {
          const completion = await client.chat.completions.create({
            model: "deepseek/deepseek-chat",
            messages: [{ role: "system", content: enrichedSystemPrompt }, ...current] as Parameters<typeof client.chat.completions.create>[0]["messages"],
            // eslint-disable -- tools cast required for openai SDK
            tools: FINANCE_TOOLS as Parameters<typeof client.chat.completions.create>[0]["tools"],
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
              send({ type: "tool_call", toolName: toolCall.function.name });

              let result: unknown;
              try {
                const args = JSON.parse(toolCall.function.arguments ?? "{}") as Record<string, unknown>;
                result = await executeToolCall(toolCall.function.name, args, coupleUserIds);
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
            // Final answer — send in one event
            const content = msg.content ?? "";
            send({ type: "text_delta", delta: content });
            break;
          }
        }

        // If the loop exhausted without a final text answer, send a fallback
        const lastMsg = current.at(-1);
        if (!lastMsg || lastMsg.role !== "assistant" || lastMsg.content === null) {
          send({ type: "text_delta", delta: "I wasn't able to complete the analysis. Please try rephrasing your question." });
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
