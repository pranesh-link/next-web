import { auth } from "@/_lib/auth";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/_lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";

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
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, name: name || null, image: picture || null },
        });
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: "google",
            providerAccountId: googleId,
          },
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
    return session.user.id;
  }

  console.log("[getAuthUserId] no session, no Bearer token");
  return null;
}
