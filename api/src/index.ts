import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyWebsocket from "@fastify/websocket";
import { setDefaultResultOrder } from "dns";
import { registerRoutes } from "./routes/index.js";
import { startCrons } from "./crons/index.js";
import { pingDb } from "./shared/db.js";

// Force IPv4 DNS — avoids Supabase IPv6-only hosts
setDefaultResultOrder("ipv4first");

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty" }
        : undefined,
  },
});

await app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

await app.register(fastifyMultipart, {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

await app.register(fastifyWebsocket);

// Health check
app.get("/health", async () => ({ status: "ok", ts: Date.now() }));

// All versioned routes
await registerRoutes(app);

// Cron jobs (chat purge, investment sync, notifications)
startCrons();

const port = Number(process.env.PORT ?? 8080);
await app.listen({ port, host: "0.0.0.0" });

// ── Startup banner ───────────────────────────────────────────────────────────
const region = process.env.FLY_REGION ?? "local";
const geminiOk = !!process.env.GEMINI_API_KEY;
const supabaseOk = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("[luvverse-api] ── STARTUP ──────────────────────────");
console.log(`[luvverse-api] env       : ${process.env.NODE_ENV ?? "development"}`);
console.log(`[luvverse-api] port      : ${port}`);
console.log(`[luvverse-api] region    : ${region}`);
console.log(`[luvverse-api] gemini    : ${geminiOk ? "configured ✓" : "NOT configured ✗"}`)
console.log(`[luvverse-api] supabase  : ${supabaseOk ? "configured ✓" : "NOT configured ✗"}`);
console.log("[luvverse-api] ─────────────────────────────────────");

// DB ping (non-blocking — logs result when it resolves)
pingDb();
