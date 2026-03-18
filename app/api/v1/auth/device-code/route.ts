import { NextResponse } from "next/server";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/auth/device-code
 *
 * Starts a Google Device Authorization flow.
 * Returns the user code and verification URL for the mobile app
 * to open in a browser. Uses the TV/Limited Input client credentials.
 */
export async function POST() {
  const clientId = process.env.GOOGLE_DEVICE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: "Server missing GOOGLE_DEVICE_CLIENT_ID" },
      { status: 500, headers: corsHeaders() },
    );
  }

  const deviceRes = await fetch("https://oauth2.googleapis.com/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      scope: "openid email profile",
    }),
  });

  if (!deviceRes.ok) {
    const err = await deviceRes.text();
    console.error("[device-code] Google error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to start device auth" },
      { status: 502, headers: corsHeaders() },
    );
  }

  const data = await deviceRes.json();

  return NextResponse.json(
    {
      success: true,
      data: {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUrl: data.verification_url,
        verificationUrlComplete: `${data.verification_url}?user_code=${data.user_code}`,
        expiresIn: data.expires_in,
        interval: data.interval,
      },
    },
    { headers: corsHeaders() },
  );
}
