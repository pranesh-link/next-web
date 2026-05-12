import path from "path";
import fs from "fs";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const filePath = path.join(process.cwd(), "data", "cms", "finance-chat.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return new Response(raw, { headers: { "Content-Type": "application/json" } });
}
