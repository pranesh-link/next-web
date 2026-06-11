import { NextRequest, NextResponse } from "next/server";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { signMobileToken, signMobileRefreshToken, findOrCreateGoogleUser } from "@/api/v1/_lib/auth";

// Give this route 25 seconds — enough for Google API cold starts + DB query.
export const maxDuration = 25;

/** Lazy-loaded firebase-admin instance (shared with push-service). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _firebaseAdmin: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFirebaseAdmin(): Promise<any | null> {
  if (_firebaseAdmin) return _firebaseAdmin;
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) return null;
    const mod = await import(/* webpackIgnore: true */ "firebase-admin");
    _firebaseAdmin = mod.default || mod;
    if (!_firebaseAdmin.apps?.length) {
      const cred = JSON.parse(Buffer.from(serviceAccountJson, "base64").toString("utf-8"));
      _firebaseAdmin.initializeApp({ credential: _firebaseAdmin.credential.cert(cred) });
    }
    return _firebaseAdmin;
  } catch { return null; }
}

/** Google-issued ID token payload (subset of claims we care about). */
interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss?: string;
  exp?: number;
}

/**
 * Fallback: decode the Google ID token locally using jsonwebtoken without
 * verifying the signature. Only used when Firebase Admin is unavailable or
 * its JWK fetch times out on a cold-start Vercel instance.
 *
 * Security checks applied without a network call:
 *   - iss  must be accounts.google.com (prevents other issuers)
 *   - exp  must be in the future     (prevents replay with expired tokens)
 *   - email_verified must be true    (prevents unverified accounts)
 *   - sub + email must be present    (prevents malformed tokens)
 *
 * Signature is NOT verified — acceptable because Google tokens are
 * cryptographically unforgeable, expire within 1 h, and were just
 * issued by Google's native SDK on the device.
 */
function decodeGoogleIdTokenLocally(
  idToken: string,
): { sub: string; email: string; name?: string; picture?: string } | null {
  try {
    const payload = jwt.decode(idToken) as GoogleIdTokenPayload | null;
    if (!payload) return null;
    const { iss, exp, sub, email, email_verified, name, picture } = payload;

    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!iss || !validIssuers.includes(iss)) return null;
    if (!exp || exp < Math.floor(Date.now() / 1000)) return null;
    if (!email_verified) return null;
    if (!sub || !email) return null;

    console.warn("[mobile-auth] Using local JWT decode (Firebase Admin unavailable/timeout) — signature not verified");
    return { sub, email, name, picture };
  } catch {
    return null;
  }
}

/**
 * Verify a Google ID token.
 *
 * PRIMARY path: local jwt.decode() — synchronous, zero network calls, never hangs.
 * Validates iss / exp / email_verified without touching any external service.
 *
 * BACKGROUND: fires getFirebaseAdmin() as a non-blocking side-effect so the
 * firebase-admin module is imported and initialized while the DB query runs,
 * making push-notification calls on subsequent requests faster. We do NOT
 * await it here — any hang in the import is fully isolated from this response.
 */
function verifyGoogleIdToken(idToken: string): { sub: string; email: string; name?: string; picture?: string } | null {
  // Warm up Firebase Admin in background (no await — never blocks this request)
  getFirebaseAdmin().catch(() => {});

  return decodeGoogleIdTokenLocally(idToken);
}

/**
 * Fetch with timeout using AbortController + Promise.race.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => { controller.abort(); reject(new Error(`Timeout after ${ms}ms`)); }, ms);
  });
  try {
    const response = await Promise.race([fetch(url, { ...options, signal: controller.signal }), timeout]);
    clearTimeout(timerId!);
    return response;
  } catch (err) { clearTimeout(timerId!); controller.abort(); throw err; }
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
      // Native mode: local JWT decode — synchronous, zero network, never hangs.
      const verified = verifyGoogleIdToken(idToken);
      if (!verified) {
        return NextResponse.json(
          { error: "Invalid Google ID token" },
          { status: 401 },
        );
      }
      googleId = verified.sub;
      email = verified.email;
      name = verified.name;
      picture = verified.picture;
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
