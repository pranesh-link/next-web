import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

export function GET() {
  const filePath = path.join(process.cwd(), "data", "cms", "couple-data-chat.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}
