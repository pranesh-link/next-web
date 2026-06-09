/**
 * Drizzle database client — Phase 2 replacement for app/_lib/prisma.ts.
 *
 * Uses DATABASE_URL directly — the same connection string that Prisma uses
 * successfully. This avoids all the search_path complexity that arises when
 * using a separate pooler URL.
 *
 * Prisma handles ?schema=public by stripping it and setting search_path
 * internally. We replicate that here: strip Prisma-specific params and
 * set search_path via the PostgreSQL options startup parameter.
 *
 * After Drizzle migration is complete, DATABASE_URL can point to the
 * Supabase Session Pooler (port 5432 on pooler host) for connection
 * efficiency — but this requires no code change here.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Use DATABASE_URL (same as Prisma) — proven to work in production.
// Fall back to DATABASE_URL_POOLER if explicitly overridden.
const rawUrl = process.env.DATABASE_URL ?? "";

// Strip Prisma-specific params that pg driver doesn't understand.
// ?schema=public → pg ignores it; we set search_path via URL options instead.
// ?pgbouncer=true → pg rejects it.
const cleanUrl = rawUrl
  .replace(/[?&]pgbouncer=true/g, "")
  .replace(/[?&]schema=[^&]*/g, "")
  .replace(/[?&]$/, "");

// Append ?options=-c search_path=public using the PostgreSQL startup parameter.
// This is processed at protocol level, before any query, and is the standard
// way to set search_path for all Postgres client libraries.
// Note: space encoded as %20, = encoded as %3D per RFC 3986.
const connectionString = cleanUrl
  ? cleanUrl + (cleanUrl.includes("?") ? "&" : "?") + "options=-c%20search_path%3Dpublic"
  : cleanUrl;

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";


// Re-export schema for convenience
export * from "./schema";
