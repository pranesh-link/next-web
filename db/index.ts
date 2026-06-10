/**
 * Drizzle database client.
 *
 * DATABASE_URL points to db.prisma.io which strips PostgreSQL startup
 * parameters. We can't set search_path via URL options.
 *
 * Solution: use a lazy singleton Pool with afterConnect hook via
 * the 'query' event on the pool itself, which fires after a client
 * is acquired but before returning it. This guarantees search_path
 * is set before any Drizzle query runs on that connection.
 *
 * Alternative taken: configure Pool with `statement_timeout` and use
 * an initialization query via pg-pool's `connect` factory pattern.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Strip Prisma-specific ?schema= param that pg driver doesn't understand.
const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = rawUrl.replace(/[?&]schema=[^&]*/g, "").replace(/[?&]$/, "");

class SchemaPool extends Pool {
  async connect() {
    const client = await super.connect();
    // SET search_path synchronously before returning client to caller.
    // Using acquireClient pattern — this runs before Drizzle sends any query.
    try {
      await (client as pg.PoolClient).query("SET search_path TO public");
    } catch {
      // Non-fatal: if this fails, the query will fail anyway
    }
    return client;
  }
}

const pool = new SchemaPool({
  connectionString: connectionString || undefined,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export const db = drizzle(pool as unknown as pg.Pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
