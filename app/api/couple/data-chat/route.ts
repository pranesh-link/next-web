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
import { db } from "@db";
import { users, coupleChats, coupleChatMessages } from "@db/schema";
import { eq, inArray } from "drizzle-orm";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
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

  const { messages, chatId: incomingChatId } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    chatId?: string;
  };

  const coupleUserIds = await getUserIdsForCouple(session.user.id);
  const coupleId = await getCoupleIdForUser(session.user.id);
  const { systemPrompt } = loadCmsChatConfig();

  // Fetch real names for couple members so the LLM can refer to them by name
  const members = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, coupleUserIds));
  const memberNames = members
    .map((m) => `  '${m.id}' → ${m.name ?? m.email}`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];
  const schema = extractSchemaForPrompt();
  const userIdList = coupleUserIds.map((id) => `'${id}'`).join(", ");
  const enrichedSystemPrompt = `${systemPrompt}

Today's date: ${today}.

Couple member user IDs and their real names (ALWAYS use these names in responses — never say "Person 1" or "Person 2"):
${memberNames}

MANDATORY: Every SQL query MUST include WHERE "userId" IN (${userIdList}) — no exceptions. Never omit this filter.

${schema}

SQL Rules:
- Only SELECT queries
- Always double-quote camelCase column names: "userId", "createdAt", "updatedAt", etc.
- Table names are snake_case as listed in the schema above
- TransactionType enum values are exactly: 'INCOME' and 'EXPENSE' (uppercase) — always use uppercase in WHERE clauses
- To get income: WHERE type = 'INCOME'
- To get expenses: WHERE type = 'EXPENSE'
- Use DATE_TRUNC('month', date) for monthly grouping
- Use DATE_TRUNC('week', date) for weekly grouping
- Add LIMIT 100 if not specified
- For amounts: SUM, AVG, MIN, MAX are fine
- For dates: compare using >= and < boundaries
- Current month start: DATE_TRUNC('month', CURRENT_DATE)
- Last month start: DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
- When showing per-person data (e.g. weight, metrics), JOIN with users table or use the userId → name mapping above to show real names`;

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
        // Resolve or create the chat thread
        let activeChatId = incomingChatId ?? null;
        const firstUserMsg = messages.findLast((m) => m.role === "user")?.content ?? "";

        if (!activeChatId && coupleId) {
          const [newChat] = await db.insert(coupleChats).values({
            coupleId,
            title: firstUserMsg.slice(0, 60) || "New chat",
          }).returning();
          activeChatId = newChat.id;
        }

        // Build the message history for the agentic loop
        const current: ChatMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Agentic loop — max 5 tool-call rounds to prevent runaway
        let answered = false;
        let finalAssistantContent = "";
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
            finalAssistantContent = content;
            send({ type: "text_delta", delta: content });
            answered = true;
            break;
          }
        }

        // Fix 3: Loop exhaustion fallback — model never produced a final answer
        if (!answered) {
          finalAssistantContent = "I gathered your data but couldn't formulate a response. Please try rephrasing your question.";
          send({
            type: "text_delta",
            delta: finalAssistantContent,
          });
        }

        // Generate 3 contextual follow-up suggestions (non-fatal)
        let suggestions: string[] = [];
        if (finalAssistantContent) {
          try {
            const suggCompletion = await client.chat.completions.create({
              model: "deepseek/deepseek-chat",
              messages: [
                {
                  role: "system",
                  content:
                    "You generate follow-up questions for a personal finance AI assistant. " +
                    "Respond ONLY with a valid JSON array of exactly 3 strings. " +
                    "No explanation. No markdown. Each question must be ≤ 60 characters.",
                },
                {
                  role: "user",
                  content: `Based on this response, suggest 3 short follow-up questions the user might ask:\n\n${finalAssistantContent.slice(0, 800)}`,
                },
              ],
              stream: false,
              temperature: 0.7,
            });
            const raw = suggCompletion.choices[0]?.message?.content ?? "[]";
            const match = raw.match(/\[[\s\S]*\]/);
            const parsed = JSON.parse(match?.[0] ?? "[]") as unknown;
            if (Array.isArray(parsed)) {
              suggestions = (parsed as unknown[])
                .filter((s): s is string => typeof s === "string")
                .slice(0, 3);
            }
          } catch {
            // Non-fatal — emit empty suggestions if generation fails
          }
        }

        // Persist messages to DB
        if (activeChatId) {
          try {
            await db.insert(coupleChatMessages).values([
              { chatId: activeChatId, role: "user", content: firstUserMsg },
              { chatId: activeChatId, role: "assistant", content: finalAssistantContent },
            ]);
            await db.update(coupleChats)
              .set({ updatedAt: new Date() })
              .where(eq(coupleChats.id, activeChatId));
          } catch {
            // Non-fatal — don't fail the response if DB write fails
          }
        }

        send({ type: "done", chatId: activeChatId, suggestions });
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
