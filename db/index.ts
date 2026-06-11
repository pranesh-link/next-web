/**
 * Drizzle database client.
 *
 * DATABASE_URL points to Supabase direct or Transaction Pooler.
 * search_path cannot be set via URL options on the Prisma proxy, so
 * SchemaPool.connect() issues SET search_path TO public on each new
 * physical connection (tracked via WeakSet to avoid redundant round-trips).
 *
 * Pool config is tuned for Vercel serverless:
 * - max:1                      — one connection per function instance
 * - connectionTimeoutMillis:12000 — covers cold TCP + SSL + SET search_path
 * - idleTimeoutMillis:20000    — keep warm between requests
 * - connect_timeout=10         — PostgreSQL-level TCP timeout (seconds)
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Strip Prisma-specific ?schema= param that pg driver doesn't understand.
// Add connect_timeout=10 (PostgreSQL protocol-level TCP timeout) so the OS
// doesn't hold the socket open for 30s+ on a cold Supabase connection.
// Use sslmode=verify-full to silence the pg SSL deprecation warning.
const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = (() => {
  let url = rawUrl
    .replace(/[?&]schema=[^&]*/g, "")
    .replace(/[?&]$/, "");
  if (!url.includes("connect_timeout")) {
    url += (url.includes("?") ? "&" : "?") + "connect_timeout=10";
  }
  if (!url.includes("sslmode")) {
    url += "&sslmode=verify-full";
  }
  return url;
})();

// Track which physical connections have already had search_path set.
// WeakSet allows GC when the client is destroyed.
const initializedClients = new WeakSet<pg.PoolClient>();

class SchemaPool extends Pool {
  async connect(): Promise<pg.PoolClient> {
    const client = await super.connect();
    // Only SET search_path on new physical connections, not every checkout.
    if (!initializedClients.has(client)) {
      try {
        await client.query("SET search_path TO public");
        initializedClients.add(client);
      } catch {
        // Non-fatal: downstream query will fail with a clearer error
      }
    }
    return client;
  }
}

const pool = new SchemaPool({
  connectionString: connectionString || undefined,
  // Serverless-optimised pool config:
  max: 1,                         // one connection per cold-start instance
  connectionTimeoutMillis: 12000, // covers cold TCP + SSL handshake + SET search_path
  idleTimeoutMillis: 20000,       // keep connection warm between requests
});

export const db = drizzle(pool as unknown as pg.Pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";

export const db = drizzle(pool as unknown as pg.Pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
