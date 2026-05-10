import { auth } from "@/_lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  scanSchedule,
  checkScheduleScanRateLimit,
} from "@/_services/finance/schedule-scan-service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkScheduleScanRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("schedule") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No schedule file provided" }, { status: 400 });
  }

  const result = await scanSchedule(file);

  if (!result.ok) {
    const payload: { error: string; geminiError?: string } = { error: result.error };
    if (result.geminiError) payload.geminiError = result.geminiError;
    return NextResponse.json(payload, { status: result.status });
  }

  return NextResponse.json(result.body, { status: result.status });
}
