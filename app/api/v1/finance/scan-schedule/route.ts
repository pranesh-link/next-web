import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import {
  scanSchedule,
  checkScheduleScanRateLimit,
} from "@/_services/finance/schedule-scan-service";

export const maxDuration = 60;

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/finance/scan-schedule
 *
 * Scan a payment schedule image using Gemini AI and return parsed data.
 *
 * @remarks POST · auth: Bearer JWT or session.
 */
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() },
    );
  }

  if (!checkScheduleScanRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: corsHeaders() },
    );
  }

  const formData = await req.formData();
  const file = formData.get("schedule") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No schedule file provided" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const result = await scanSchedule(file);

  if (!result.ok) {
    const payload: { error: string; geminiError?: string } = {
      error: result.error,
    };
    if (result.geminiError) payload.geminiError = result.geminiError;
    return NextResponse.json(payload, {
      status: result.status,
      headers: corsHeaders(),
    });
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: corsHeaders(),
  });
}
