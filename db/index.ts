/**
 * Drizzle database client — tuned for Vercel serverless + Supabase pooler.
 *
 * search_path is set via the PostgreSQL `options` startup parameter in the
 * connection URL (zero round-trip, no extra query). This replaces the old
 * SchemaPool subclass which issued SET search_path TO public as a separate
 * query after connect — that query had no timeout and caused 20s hangs.
 *
 * Pool config:
 * - max:1                       — one connection per serverless instance
 * - connectionTimeoutMillis:12000 — covers cold TCP + SSL handshake
 * - idleTimeoutMillis:20000     — keep warm between requests
 * - connect_timeout=10          — PostgreSQL-level TCP timeout (seconds)
 * - options=-c search_path=public — set at protocol level, no round-trip
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Build the final connection string from DATABASE_URL:
// 1. Strip Prisma-specific ?schema= param (pg driver doesn't understand it)
// 2. Add connect_timeout=10 — PostgreSQL-level TCP timeout in seconds
// 3. Add options=-c search_path=public — sets search_path at protocol level
//    (replaces the old SET search_path round-trip that could hang 20s+)
// 4. Add sslmode=verify-full if no sslmode is present (silences pg v8 warning)
const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = (() => {
  let url = rawUrl
    .replace(/[?&]schema=[^&]*/g, "")
    .replace(/[?&]$/, "");
  const sep = url.includes("?") ? "&" : "?";
  if (!url.includes("connect_timeout")) url += sep + "connect_timeout=10";
  if (!url.includes("options=")) url += "&options=-c%20search_path%3Dpublic";
  if (!url.includes("sslmode")) url += "&sslmode=verify-full";
  return url;
})();

const pool = new Pool({
  connectionString: connectionString || undefined,
  max: 1,                         // one connection per serverless instance
  connectionTimeoutMillis: 12000, // covers cold TCP + SSL handshake
  idleTimeoutMillis: 20000,       // keep warm between requests
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
