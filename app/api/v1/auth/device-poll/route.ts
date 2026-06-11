import { NextResponse } from "next/server";
import { signMobileToken, findOrCreateGoogleUser } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export const maxDuration = 25;

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 6000): Promise<Response> {
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`Timeout: ${url}`)), ms);
  });
  try {
    const res = await Promise.race([fetch(url, options), timeout]);
    clearTimeout(timerId!);
    return res;
  } catch (err) { clearTimeout(timerId!); throw err; }
}

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/auth/device-poll
 * Body: { deviceCode }
 *
 * Polls Google's token endpoint for the device authorization result.
 * Returns { status: 'pending' } while waiting, or
 * { status: 'complete', token, user } when the user has authorized.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { deviceCode } = body;

  if (!deviceCode) {
    return NextResponse.json(
      { success: false, error: "deviceCode is required" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const clientId = process.env.GOOGLE_DEVICE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DEVICE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { success: false, error: "Server missing device client credentials" },
      { status: 500, headers: corsHeaders() },
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });

  const data = await tokenRes.json();

  // Still waiting for user to authorize
  if (data.error === "authorization_pending") {
    return NextResponse.json(
      { success: true, data: { status: "pending" } },
      { headers: corsHeaders() },
    );
  }

  if (data.error === "slow_down") {
    return NextResponse.json(
      { success: true, data: { status: "slow_down" } },
      { headers: corsHeaders() },
    );
  }

  // Any other error
  if (data.error) {
    return NextResponse.json(
      { success: false, error: data.error_description || data.error },
      { status: 400, headers: corsHeaders() },
    );
  }

  // Success — we have tokens. Get user info.
  if (!data.access_token) {
    return NextResponse.json(
      { success: false, error: "No access token in response" },
      { status: 502, headers: corsHeaders() },
    );
  }

  const userRes = await fetchWithTimeout(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${data.access_token}` } },
  );

  if (!userRes.ok) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch user info" },
      { status: 502, headers: corsHeaders() },
    );
  }

  const googleUser = await userRes.json();
  const { sub: googleId, email, name, picture } = googleUser;

  if (!email) {
    return NextResponse.json(
      { success: false, error: "No email in Google account" },
      { status: 400, headers: corsHeaders() },
    );
  }

  // Find or create user
  const user = await findOrCreateGoogleUser({ googleId, email, name, picture });

  const jwt = signMobileToken(user.id);

  return NextResponse.json(
    {
      success: true,
      data: {
        status: "complete",
        token: jwt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
    },
    { headers: corsHeaders() },
  );
}
