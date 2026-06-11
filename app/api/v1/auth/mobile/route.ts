import { NextRequest, NextResponse } from "next/server";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { signMobileToken, signMobileRefreshToken, findOrCreateGoogleUser } from "@/api/v1/_lib/auth";

// Give this route 25 seconds — enough for Google API cold starts + DB query.
// Default Vercel serverless limit is 10s which is too tight for external APIs.
export const maxDuration = 25;

/**
 * Fetch with an explicit timeout using AbortController.
 * More reliable than AbortSignal.timeout() in Node.js 22 on Vercel.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 7000): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(new Error(`Timeout after ${ms}ms`)), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * POST /api/v1/auth/mobile
 *
 * Supports two auth modes:
 * 1. Native: accepts { idToken } from @react-native-google-signin
 * 2. Web: accepts { code, redirectUri } from expo-auth-session
 *
 * Verifies with Google, finds/creates user, returns JWT + user object.
 *
 * @remarks POST · auth: Google token/code verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, code, redirectUri } = body;

    let googleId: string;
    let email: string;
    let name: string | undefined;
    let picture: string | undefined;

    if (idToken) {
      // Native mode: verify ID token directly
      const verifyRes = await fetchWithTimeout(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );

      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: "Invalid Google ID token" },
          { status: 401 },
        );
      }

      const payload = await verifyRes.json();
      // Accept tokens from either the web client (NextAuth) or the mobile
      // serverClientId (Firebase project). Both are trusted audiences.
      const trustedAudiences = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_MOBILE_CLIENT_ID,
      ].filter(Boolean);
      if (
        trustedAudiences.length > 0 &&
        !trustedAudiences.includes(payload.aud)
      ) {
        return NextResponse.json(
          { error: "Token audience mismatch" },
          { status: 401 },
        );
      }

      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else if (code && redirectUri) {
      // Web mode: exchange auth code for tokens
      const tokenRes = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
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
        console.error("[mobile-auth] Token exchange failed:", err);
        return NextResponse.json(
          { error: "Token exchange failed" },
          { status: 401 },
        );
      }

      const tokens = await tokenRes.json();

      // Fetch user info with access token
      const userRes = await fetchWithTimeout(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );

      if (!userRes.ok) {
        return NextResponse.json(
          { error: "Failed to get user info" },
          { status: 401 },
        );
      }

      const userInfo = await userRes.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else if (body.accessToken) {
      // First, check if this is one of our own (possibly expired) JWTs.
      // Decode without verification to extract userId — if valid, re-issue.
      try {
        const decoded = jwt.decode(body.accessToken) as {
          sub?: string;
          type?: string;
        } | null;
        if (decoded?.sub && decoded.type === "access") {
          // DB query with a race-based timeout to avoid hanging
          const existingUser = await Promise.race([
            db.query.users.findFirst({ where: eq(users.id, decoded.sub) }),
            new Promise<undefined>((_, reject) =>
              setTimeout(() => reject(new Error("DB timeout")), 5000)
            ),
          ]);
          if (existingUser?.email) {
            // It's our own JWT — skip Google verification, re-issue tokens
            const token = signMobileToken(existingUser.id);
            const refreshToken = signMobileRefreshToken(existingUser.id);
            return NextResponse.json({
              token,
              refreshToken,
              user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                image: existingUser.image,
              },
            });
          }
        }
      } catch {
        // Not a JWT or DB timeout — fall through to Google verification
      }

      // Access token mode: verify with Google userinfo endpoint
      const userRes = await fetchWithTimeout(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${body.accessToken}` } },
      );

      if (!userRes.ok) {
        return NextResponse.json(
          { error: "Invalid Google access token" },
          { status: 401 },
        );
      }

      const userInfo = await userRes.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      return NextResponse.json(
        {
          error:
            "Provide idToken (native), code+redirectUri (web), or accessToken",
        },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email from Google" },
        { status: 400 },
      );
    }

    // Find or create user
    const user = await findOrCreateGoogleUser({ googleId, email, name, picture });

    const token = signMobileToken(user.id);
    const refreshToken = signMobileRefreshToken(user.id);

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("[mobile-auth] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
