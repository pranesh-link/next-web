import { NextRequest, NextResponse } from "next/server";
import { signMobileToken, findOrCreateGoogleUser } from "@/api/v1/_lib/auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const AUTH_BASE_URL = process.env.AUTH_BASE_URL!;
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

/**
 * GET /api/v1/auth/google/callback
 * Google redirects here after user consents.
 * Exchanges auth code for tokens, creates/finds user, then redirects to the mobile app deep link with a JWT.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const scheme = searchParams.get("state") || "luvverse";

  if (!code) {
    return new NextResponse(errorPage("No authorization code received"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    // Must match the redirect_uri sent in /start (uses public AUTH_BASE_URL)
    const redirectUri = `${AUTH_BASE_URL}/api/v1/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new NextResponse(errorPage(`Token exchange failed: ${err}`), {
        status: 401,
        headers: { "Content-Type": "text/html" },
      });
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!userRes.ok) {
      return new NextResponse(errorPage("Failed to fetch user info"), {
        status: 401,
        headers: { "Content-Type": "text/html" },
      });
    }

    const googleUser = await userRes.json();
    const { sub: googleId, email, name, picture } = googleUser;

    if (!email) {
      return new NextResponse(errorPage("No email returned from Google"), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Find or create user
    const user = await findOrCreateGoogleUser({ googleId, email, name, picture });

    const token = signMobileToken(user.id);
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    }));

    // Redirect to the mobile app deep link
    const deepLink = `${scheme}://auth?token=${token}&user=${userData}`;

    return NextResponse.redirect(deepLink);
  } catch (error) {
    return new NextResponse(
      errorPage(error instanceof Error ? error.message : "Authentication failed"),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}

function errorPage(message: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
    <div style="text-align:center"><h2>Authentication Error</h2><p>${message}</p></div></body></html>`;
}
