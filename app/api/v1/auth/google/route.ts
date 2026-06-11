import { NextResponse } from "next/server";
import { signMobileToken, findOrCreateGoogleUser } from "@/api/v1/_lib/auth";
import { corsHeaders } from "@/api/v1/_lib/cors";

export const maxDuration = 25;

async function fetchWT(url: string, opts: RequestInit = {}, ms = 7000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(t); }
}

/**
 * POST /api/v1/auth/google
 * Accepts one of:
 *   - { accessToken }  — verifies via Google userinfo
 *   - { idToken }      — verifies via Google tokeninfo
 *   - { code, redirectUri } — exchanges auth code for tokens (Web client, requires client_secret)
 * Finds or creates the user, returns a JWT.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[auth/google] POST received, keys:', Object.keys(body));
    const { idToken, accessToken, code, redirectUri } = body;

    if (!idToken && !accessToken && !code) {
      return NextResponse.json(
        { success: false, error: "idToken, accessToken, or code is required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    let googleId: string;
    let email: string;
    let name: string | undefined;
    let picture: string | undefined;

    if (code) {
      // Exchange authorization code for tokens (used by mobile auth flow)
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return NextResponse.json(
          { success: false, error: `Code exchange failed: ${err}` },
          { status: 401, headers: corsHeaders() },
        );
      }
      const tokens = await tokenRes.json();

      // Now fetch user info with the access_token
      const googleRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );
      if (!googleRes.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch user info" },
          { status: 401, headers: corsHeaders() },
        );
      }
      const userInfo = await googleRes.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else if (accessToken) {
      // Verify via Google userinfo endpoint
      const googleRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!googleRes.ok) {
        return NextResponse.json(
          { success: false, error: "Invalid Google access token" },
          { status: 401, headers: corsHeaders() },
        );
      }
      const userInfo = await googleRes.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      // Verify via Google tokeninfo endpoint
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        {},
      );
      if (!googleRes.ok) {
        return NextResponse.json(
          { success: false, error: "Invalid Google ID token" },
          { status: 401, headers: corsHeaders() },
        );
      }
      const tokenInfo = await googleRes.json();
      googleId = tokenInfo.sub;
      email = tokenInfo.email;
      name = tokenInfo.name;
      picture = tokenInfo.picture;
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "No email in Google token" },
        { status: 400, headers: corsHeaders() },
      );
    }

    // Find existing user by email, or create new one
    const user = await findOrCreateGoogleUser({ googleId, email, name, picture });

    const token = signMobileToken(user.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
