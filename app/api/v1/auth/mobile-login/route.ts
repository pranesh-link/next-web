import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/v1/auth/mobile-login?return_url=exp://...
 *
 * Initiates Google OAuth for mobile clients (Android).
 * Redirects to Google's consent screen with the Web client ID
 * and a server-side callback. The return_url is encoded in the
 * state parameter so the callback can redirect back to the app.
 */
export async function GET(request: NextRequest) {
  const returnUrl = request.nextUrl.searchParams.get("return_url");
  if (!returnUrl || !returnUrl.startsWith("exp://")) {
    return NextResponse.json(
      { error: "return_url is required and must use exp:// scheme" },
      { status: 400 },
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Server misconfigured: missing GOOGLE_CLIENT_ID" },
      { status: 500 },
    );
  }

  // Derive the callback URL from the Host header so it matches
  // the actual IP/hostname the phone used to reach this server.
  const host = request.headers.get("host") || "localhost:3737";
  const protocol = host.startsWith("localhost") ? "http" : "http";
  const callbackUrl = `${protocol}://${host}/api/v1/auth/mobile-callback`;

  // Encode return_url + callback_url + nonce in state param
  const nonce = crypto.randomBytes(8).toString("hex");
  const state = Buffer.from(
    JSON.stringify({ returnUrl, callbackUrl, nonce }),
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    state,
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  );
}
