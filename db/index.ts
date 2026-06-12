/**
 * Drizzle database client.
 *
 * DATABASE_URL points to Supabase Transaction Pooler (port 6543).
 * IMPORTANT: Do NOT run session-level SET commands (e.g. SET search_path)
 * against the Transaction Pooler — each transaction may hit a different
 * backend connection, and the pooler does not support session commands.
 *
 * Pool config tuned for Vercel serverless:
 * - max:1                       — one connection per function instance
 * - connectionTimeoutMillis:10000 — covers cold TCP + TLS handshake
 * - idleTimeoutMillis:20000     — keep warm between requests
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Strip params that the pg driver doesn't understand.
const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = rawUrl
  .replace(/[?&]schema=[^&]*/g, "")
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 20000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
