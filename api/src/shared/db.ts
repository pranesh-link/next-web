/**
 * Drizzle DB client for the Fly.io API server.
 * Identical logic to db/index.ts but self-contained within api/src/.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { setDefaultResultOrder } from "dns";
import * as schema from "./schema.js";

setDefaultResultOrder("ipv4first");

const { Pool } = pg;

const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = rawUrl
  .replace(/[?&]schema=[^&]*/g, "")
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on("connect", () => {
  console.log(`[db] client connected (pool total: ${pool.totalCount})`);
});

pool.on("error", (err: Error & { code?: string }) => {
  // Log error code only — never the connection string
  console.error(`[db] pool error code=${err.code ?? "UNKNOWN"} msg=${err.message}`);
});

/** Ping the DB and log result. Call once at startup. */
export async function pingDb(): Promise<void> {
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    console.log(`[db] ping ok latency=${Date.now() - start}ms`);
  } catch (err) {
    const e = err as Error & { code?: string };
    console.error(`[db] ping failed code=${e.code ?? "UNKNOWN"} msg=${e.message}`);
  }
}

export const db = drizzle(pool, { schema });
export type DB = typeof db;
