/**
 * Drizzle database client — Phase 2 replacement for app/_lib/prisma.ts.
 *
 * Uses DATABASE_URL_POOLER (Supabase Transaction Pooler, port 6543) so
 * existing DATABASE_URL and Prisma are completely untouched during migration.
 * Once all modules are migrated and verified, swap DATABASE_URL to the
 * pooler value and remove DATABASE_URL_POOLER.
 *
 * To activate in Vercel: add DATABASE_URL_POOLER env var pointing to the
 * Supabase Transaction Pooler string (port 6543, ?pgbouncer=true).
 */

import { drizzle } from "drizzle-orm/pg";
import { Pool } from "pg";
import * as schema from "./schema";

// Falls back to DATABASE_URL for local dev if pooler var not set.
const connectionString =
  process.env.DATABASE_URL_POOLER ?? process.env.DATABASE_URL ?? "";

const pool = new Pool({ connectionString: connectionString || undefined });

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
