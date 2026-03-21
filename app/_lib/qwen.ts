import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getQwenClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY!,
      defaultHeaders: {
        "HTTP-Referer": "https://pranesh.link",
        "X-Title": "Coupletastic",
      },
    });
  }
  return _client;
}

export const QWEN_MODEL = "qwen/qwen2.5-vl-32b-instruct:free";
