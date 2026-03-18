import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const AUTH_BASE_URL = process.env.AUTH_BASE_URL!;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * GET /api/v1/auth/google/start
 * Redirects the browser to Google OAuth consent screen.
 * The callback URL points back to our server, not the mobile app.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const appScheme = searchParams.get("scheme") || "coupletastic";

  // Use the public base URL (e.g. ngrok) so Google accepts the redirect URI
  const callbackUrl = `${AUTH_BASE_URL}/api/v1/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    prompt: "consent",
    state: appScheme,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
