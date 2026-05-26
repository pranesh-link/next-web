import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { sendTestPush } from "@/_services/finance/push-service";

export async function OPTIONS() {
  return handleOptions();
}

/** In-memory rate limit: userId → last test timestamp */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

/**
 * POST /api/v1/notifications/test
 *
 * Sends a test push notification to the authenticated user's devices.
 * Rate limited to 1 request per minute per user.
 *
 * @remarks POST · auth: JWT Bearer token
 */
export async function POST(_request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    // Rate limit: 1 test per 60s per user
    const lastSent = rateLimitMap.get(userId);
    if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
      const retryAfter = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSent)) / 1000);
      return NextResponse.json(
        { success: false, error: `Rate limited. Try again in ${retryAfter}s.` },
        { status: 429, headers: corsHeaders() },
      );
    }

    rateLimitMap.set(userId, Date.now());

    const result = await sendTestPush(userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          sent: result.sent,
          failed: result.failed,
          message: result.sent > 0
            ? "Test notification sent successfully"
            : "No active devices found. Make sure the app has push permissions enabled.",
        },
      },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[v1/notifications/test] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send test notification",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
