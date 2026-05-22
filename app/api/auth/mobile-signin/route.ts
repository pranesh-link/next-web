import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/auth/mobile-signin
 *
 * Initiates Google OAuth for mobile clients. Redirects the browser to Google's
 * authorization endpoint with an HTTPS callback URL on this server.
 *
 * @remarks GET · No auth required. Used by mobile app via WebBrowser.openAuthSessionAsync.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXTAUTH_URL || "https://pranesh.link";
  const redirectUri = `${baseUrl}/api/auth/mobile-signin/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
