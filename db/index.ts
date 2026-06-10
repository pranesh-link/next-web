/**
 * Drizzle database client.
 *
 * Uses DATABASE_URL directly (same as Prisma) — the Prisma Postgres proxy
 * at db.prisma.io strips PostgreSQL startup parameters, so search_path
 * cannot be set via URL options or pool events. Instead, all tables in
 * db/schema.ts are defined under pgSchema('public') so Drizzle generates
 * fully-qualified SQL: SELECT ... FROM "public"."users" — which works
 * regardless of the session's search_path.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Use DATABASE_URL directly — same connection that Prisma uses.
// Strip Prisma-specific ?schema= param that pg driver doesn't understand.
const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = rawUrl.replace(/[?&]schema=[^&]*/g, "").replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
