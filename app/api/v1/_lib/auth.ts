import { auth } from "@/_lib/auth";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@db";
import { users, authAccounts } from "@db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";

/** In-memory debounce: userId → last lastSeenAt stamp timestamp (ms). */
const _lastSeenCache = new Map<string, number>();
const LAST_SEEN_DEBOUNCE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fire-and-forget: stamp User.lastSeenAt at most once per hour per user.
 * Also captures the X-Device-Info header if present (sent by mobile clients).
 */
function _stampLastSeen(userId: string, headersList: Awaited<ReturnType<typeof headers>>): void {
  const now = Date.now();
  const last = _lastSeenCache.get(userId) ?? 0;
  if (now - last < LAST_SEEN_DEBOUNCE_MS) return;
  _lastSeenCache.set(userId, now);
  const deviceInfo = headersList.get('x-device-info');
  db.update(users)
    .set({
      lastSeenAt: new Date(),
      ...(deviceInfo ? { lastDeviceInfo: deviceInfo } : {}),
    })
    .where(eq(users.id, userId))
    .catch(() => {});
}

/**
 * Signs a short-lived access token for mobile clients.
 *
 * @param userId - The authenticated user's ID.
 * @returns A JWT valid for 1 hour.
 */
export function signMobileToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

/**
 * Signs a long-lived refresh token for mobile clients.
 *
 * @param userId - The authenticated user's ID.
 * @returns A JWT valid for 90 days.
 */
export function signMobileRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: "90d",
  });
}

/**
 * Gets the authenticated user ID from either:
 * 1. NextAuth session (web/cookie-based)
 * 2. Bearer JWT token (mobile - our own JWT)
 * 3. Bearer Google access_token (mobile - from direct OAuth flow)
 *    Also creates the user record if it doesn't exist yet.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
  // Check for Bearer token first (mobile) — avoids expensive auth() DB call
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    console.log("[getAuthUserId] Bearer token prefix:", token.substring(0, 20) + "...");

    // Try as our own JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        type?: string;
      };
      // Reject refresh tokens used as access tokens
      if (decoded.type === "refresh") {
        console.log("[getAuthUserId] refresh token rejected for API access");
        return null;
      }
      if (decoded.sub) {
        console.log("[getAuthUserId] via JWT:", decoded.sub);
        _stampLastSeen(decoded.sub, headersList);
        return decoded.sub;
      }
    } catch {
      console.log("[getAuthUserId] JWT verify failed, trying Google token");
      // Not a valid JWT — try as a Google access_token
    }

    // Try as a Google access_token
    try {
      const googleRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!googleRes.ok) return null;

      const { sub: googleId, email, name, picture } = await googleRes.json();
      if (!email) return null;

      // Find or create user
      let user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) {
        const [created] = await db.insert(users)
          .values({ email, name: name || null, image: picture || null })
          .returning();
        user = created;
        await db.insert(authAccounts).values({
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: googleId,
        });
      }
      return user.id;
    } catch {
      return null;
    }
  }

  // No Bearer token — web request, use NextAuth session (cookie-based)
  const session = await auth();
  if (session?.user?.id) {
    console.log("[getAuthUserId] via NextAuth session:", session.user.id);
    _stampLastSeen(session.user.id, headersList);
    return session.user.id;
  }

  console.log("[getAuthUserId] no session, no Bearer token");
  return null;
  } catch {
    console.error("[getAuthUserId] unexpected error, returning null");
    return null;
  }
}

/**
 * Shared helper: find or create a Google-authenticated user.
 * Used by all OAuth callback routes (google, mobile, device-poll, etc.)
 * Also updates name/image if missing on an existing account.
 */
export async function findOrCreateGoogleUser(params: {
  googleId: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}) {
  const { googleId, email, name, picture } = params;

  let user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ email, name: name || null, image: picture || null })
      .returning();
    user = created;
    await db.insert(authAccounts).values({
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: googleId,
    });
  } else if (name || picture) {
    const update: Record<string, string | null> = {};
    if (name && !user.name) update.name = name;
    if (picture && !user.image) update.image = picture;
    if (Object.keys(update).length > 0) {
      const [updated] = await db
        .update(users)
        .set(update)
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    }
  }

  return user;
}
