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
import { COUPLE_DATA_TOOLS, executeCoupleDataToolCall } from "@/couple/_lib/couple-data-chat-tools";

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

  // Fix 1: Inject today's date so the model can resolve relative time references correctly
  const today = new Date().toISOString().split("T")[0];
  const enrichedSystemPrompt = `${systemPrompt}\n\nToday's date: ${today}. When the user asks about "last month", "this month", "last week", derive the correct date range from today. Call the appropriate tools with correct YYYY-MM values. Do not guess or fabricate data.`;

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
            tools: COUPLE_DATA_TOOLS as Parameters<typeof client.chat.completions.create>[0]["tools"],
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
                result = await executeCoupleDataToolCall(toolCall.function.name, args, coupleUserIds);
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
