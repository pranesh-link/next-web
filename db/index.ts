/**
 * Drizzle database client — Phase 2 replacement for app/_lib/prisma.ts.
 *
 * Uses DATABASE_URL_POOLER (Supabase Transaction Pooler, port 6543) so
 * existing DATABASE_URL and Prisma are completely untouched during migration.
 *
 * NOTE: db/ is excluded from tsconfig.json until 'npm install' is run
 * in codespace to install drizzle-orm. Once installed, remove 'db/**'
 * from tsconfig exclude and this file becomes fully type-checked.
 *
 * After migration is verified: swap DATABASE_URL to the pooler value
 * and remove DATABASE_URL_POOLER.
 */

import { drizzle } from "drizzle-orm/node-postgres";
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
