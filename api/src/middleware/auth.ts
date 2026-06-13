/**
 * JWT auth middleware for Fastify.
 * Validates the same tokens issued by the Next.js auth layer.
 * Supports:
 *   1. Our own JWT (sub = userId, type = "access")
 *   2. Google access_token (falls back to userinfo endpoint)
 */
import jwt from "jsonwebtoken";
import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../shared/db.js";
import { users, authAccounts } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "fallback-dev-secret";

/** In-memory debounce: userId → last lastSeenAt ms */
const _lastSeenCache = new Map<string, number>();
const LAST_SEEN_DEBOUNCE_MS = 60 * 60 * 1000;

function stampLastSeen(userId: string, deviceInfo?: string | null) {
  const now = Date.now();
  if ((now - (_lastSeenCache.get(userId) ?? 0)) < LAST_SEEN_DEBOUNCE_MS) return;
  _lastSeenCache.set(userId, now);
  db.update(users)
    .set({ lastSeenAt: new Date(), ...(deviceInfo ? { lastDeviceInfo: deviceInfo } : {}) })
    .where(eq(users.id, userId))
    .catch(() => {});
}

export async function extractUserId(req: FastifyRequest): Promise<string | null> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7);
  const deviceInfo = req.headers["x-device-info"] as string | undefined;

  // 1. Try our own JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; type?: string };
    if (decoded.type === "refresh") return null;
    if (decoded.sub) {
      stampLastSeen(decoded.sub, deviceInfo);
      return decoded.sub;
    }
  } catch {
    // Not our JWT — try Google
  }

  // 2. Try Google access_token
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const { sub: googleId, email, name, picture } = await res.json() as {
      sub: string; email?: string; name?: string; picture?: string;
    };
    if (!email) return null;

    let user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      const [created] = await db.insert(users)
        .values({ email, name: name ?? null, image: picture ?? null })
        .returning();
      user = created;
      await db.insert(authAccounts).values({
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: googleId,
      });
    }
    stampLastSeen(user.id, deviceInfo);
    return user.id;
  } catch {
    return null;
  }
}

/** Fastify preHandler that rejects unauthenticated requests */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const userId = await extractUserId(req);
  if (!userId) {
    console.log(`[auth] 401 method=${req.method} path=${req.url}`);
    reply.code(401).send({ success: false, error: "Not authenticated" });
    return;
  }
  // Attach to request for route handlers
  (req as FastifyRequest & { userId: string }).userId = userId;
  // Attach email for structured logging (non-blocking, safe to fail)
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true } }).catch(() => null);
  (req as any).userEmail = user?.email ?? null;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access" }, JWT_SECRET, { expiresIn: "1h" });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, JWT_SECRET, { expiresIn: "90d" });
}
