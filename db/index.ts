/**
 * Drizzle database client.
 *
 * DATABASE_URL points to db.prisma.io which strips PostgreSQL startup
 * parameters, so search_path cannot be set via URL options.
 *
 * Solution: subclass pg.Pool and override connect() to issue
 * SET search_path TO public — but only ONCE per physical connection,
 * tracked via a WeakSet. This avoids an extra round-trip on every
 * query checkout (which was causing 504 timeouts on Vercel).
 *
 * Pool config is tuned for Vercel serverless:
 * - max:1        — one connection per function instance (serverless)
 * - connectionTimeoutMillis:8000 — fail fast before Vercel's 10s limit
 * - idleTimeoutMillis:20000      — keep warm between requests
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Strip Prisma-specific ?schema= param that pg driver doesn't understand.
const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = rawUrl
  .replace(/[?&]schema=[^&]*/g, "")
  .replace(/[?&]$/, "");

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
  ssl: { rejectUnauthorized: false },
  // Serverless-optimised pool config:
  max: 1,                        // one connection per cold-start instance
  connectionTimeoutMillis: 5000, // fail fast — DB cold-connect must finish well within Vercel's limit
  idleTimeoutMillis: 20000,      // keep connection warm between requests
});

export const db = drizzle(pool as unknown as pg.Pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
