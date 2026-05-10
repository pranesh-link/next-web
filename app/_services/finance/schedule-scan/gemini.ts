import { ai, GEMINI_SCHEDULE_MODEL } from "./config";
import { buildSchedulePrompt } from "./prompt";
import type { ScheduleData } from "./types";

/**
 * Call Gemini Vision to parse a loan-schedule document and return the
 * raw (un-normalized) {@link ScheduleData} payload.
 *
 * @param fileBuffer - Raw file bytes of the uploaded schedule.
 * @param mimeType - MIME type of the uploaded file.
 * @returns The parsed schedule data straight from the model.
 * @throws {Error} when Gemini is unconfigured, times out, returns empty,
 * is truncated by `MAX_TOKENS`, or returns unparseable output.
 */
export async function scanWithGemini(
  fileBuffer: ArrayBuffer,
  mimeType: string,
): Promise<ScheduleData> {
  if (!ai) throw new Error("Gemini API key not configured");

  const timeoutMs = 50_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs)
  );

  const geminiConfig = { temperature: 1.0, thinkingConfig: { thinkingBudget: 0 } };

  const geminiPromise = ai.models.generateContent({
    model: GEMINI_SCHEDULE_MODEL,
    config: geminiConfig,
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: Buffer.from(fileBuffer).toString("base64") } },
          { text: buildSchedulePrompt() },
        ],
      },
    ],
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);

  const finishReason = (response as { candidates?: Array<{ finishReason?: string }> }).candidates?.[0]?.finishReason;

  let text = response.text?.trim() ?? "";
  console.error("[scan-schedule] finishReason:", finishReason, "| text length:", text.length);
  if (text) console.error("[scan-schedule] Gemini raw (first 500):", text.slice(0, 500));

  if (!text) {
    throw new Error(`Gemini returned an empty response (finishReason: ${finishReason})`);
  }

  if (finishReason === "MAX_TOKENS") {
    throw new Error("Schedule document too large: Gemini output was truncated");
  }

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  try {
    return JSON.parse(text) as ScheduleData;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ScheduleData;
    }
    throw new Error(`JSON parse failed. Response started with: ${text.slice(0, 120)}`);
  }
}
