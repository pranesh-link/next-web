import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { db } from "../../plugins/db.js";
import { users } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import { signAccessToken, signRefreshToken } from "../../middleware/auth.js";

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "fallback-dev-secret";

export async function registerAuthRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/mobile — Google ID token → LuvVerse JWT
  app.post("/mobile", async (req, reply) => {
    const { idToken, code, redirectUri, refreshToken: legacyRefresh, accessToken: legacyAccess } = req.body as Record<string, string>;

    let userId: string | null = null;

    if (idToken) {
      // Decode Google ID token locally (no network call)
      const payload = jwt.decode(idToken) as Record<string, unknown> | null;
      if (!payload) return reply.code(401).send({ error: "Invalid Google ID token" });
      const { iss, exp, sub, email, email_verified, name, picture } = payload as Record<string, unknown>;
      const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
      if (!validIssuers.includes(iss as string)) return reply.code(401).send({ error: "Invalid issuer" });
      if (!exp || (exp as number) < Date.now() / 1000) return reply.code(401).send({ error: "Token expired" });
      if (!email_verified) return reply.code(401).send({ error: "Email not verified" });
      if (!sub || !email) return reply.code(401).send({ error: "Missing claims" });

      let user = await db.query.users.findFirst({ where: eq(users.email, email as string) });
      if (!user) {
        const [created] = await db.insert(users).values({ email: email as string, name: (name as string) ?? null, image: (picture as string) ?? null }).returning();
        user = created;
      }
      userId = user.id;
    } else if (legacyRefresh) {
      // Refresh token path
      try {
        const decoded = jwt.verify(legacyRefresh, JWT_SECRET) as { sub: string; type?: string };
        if (decoded.type !== "refresh") return reply.code(401).send({ error: "Invalid token type" });
        userId = decoded.sub;
      } catch {
        return reply.code(401).send({ error: "Invalid refresh token" });
      }
    } else if (legacyAccess) {
      try {
        const decoded = jwt.decode(legacyAccess) as { sub?: string; type?: string } | null;
        if (decoded?.sub && decoded.type === "access") userId = decoded.sub;
      } catch { /* ignore */ }
    }

    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true, name: true, email: true, image: true } });
    if (!user) return reply.code(401).send({ error: "User not found" });

    return reply.send({
      token: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
    });
  });

  // POST /api/v1/auth/refresh — rotate tokens
  app.post("/refresh", async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return reply.code(400).send({ error: "refreshToken required" });
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { sub: string; type?: string };
      if (decoded.type !== "refresh") return reply.code(401).send({ error: "Invalid token type" });
      const user = await db.query.users.findFirst({ where: eq(users.id, decoded.sub), columns: { id: true, name: true, email: true, image: true } });
      if (!user) return reply.code(401).send({ error: "User not found" });
      return reply.send({
        token: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id),
        user: { id: user.id, name: user.name, email: user.email, image: user.image },
      });
    } catch {
      return reply.code(401).send({ error: "Invalid or expired refresh token" });
    }
  });
}
