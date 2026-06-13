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

export const db = drizzle(pool, { schema });
export type DB = typeof db;
