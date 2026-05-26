import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { sendTestPushDiagnostic } from "@/_services/finance/push-service";

export async function OPTIONS() {
  return handleOptions();
}

/** In-memory rate limit: userId → last test timestamp */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 15_000;

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

    const result = await sendTestPushDiagnostic(userId);

    const messageByReason: Record<string, string> = {
      OK: `Test notification sent to ${result.sent} device(s)`,
      PARTIAL: `Sent to ${result.sent}/${result.deviceCount} device(s); ${result.failed} failed`,
      NO_DEVICES: `No active devices found for userId ${userId.substring(0, 8)}... — Tap 'Re-register this device' in Settings.`,
      FCM_NOT_CONFIGURED:
        "Push service is not configured on the server (missing FCM credentials).",
      CIRCUIT_OPEN:
        "Push service is temporarily disabled due to repeated FCM failures. Try again in 60s.",
      ALL_FAILED:
        "All device tokens were rejected by FCM. They have been deactivated. Tap 'Re-register this device'.",
      EXCEPTION: "An unexpected error occurred while sending the push.",
    };

    return NextResponse.json(
      {
        success: result.sent > 0,
        data: {
          sent: result.sent,
          failed: result.failed,
          deviceCount: result.deviceCount,
          fcmConfigured: result.fcmConfigured,
          circuitOpen: result.circuitOpen,
          reason: result.reason,
          userId,
          message: messageByReason[result.reason] ?? "Unknown result",
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
