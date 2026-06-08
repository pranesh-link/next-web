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

/**
 * Drizzle database client — Phase 2 replacement for app/_lib/prisma.ts.
 *
 * Uses DATABASE_URL_POOLER (Supabase Transaction Pooler, port 6543) so
 * existing DATABASE_URL and Prisma are completely untouched during migration.
 *
 * PgBouncer (Supabase pooler) in Transaction mode does NOT support PostgreSQL
 * prepared statements. drizzle-orm/node-postgres uses the pg `Pool` which
 * sends queries via the extended query protocol (prepared statements).
 *
 * Fix: when routing through PgBouncer, use the `postgres` package (postgres.js)
 * via `drizzle-orm/postgres-js` which has a `prepare: false` option.
 * When using a direct connection (local dev / CI), use the standard pg Pool.
 *
 * After migration is verified: swap DATABASE_URL to the pooler value
 * and remove DATABASE_URL_POOLER.
 */

import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL_POOLER ?? process.env.DATABASE_URL ?? "";

// Detect PgBouncer by port 6543 or explicit pgbouncer=true param.
const isPgBouncer =
  connectionString.includes("pgbouncer=true") ||
  connectionString.includes(":6543/");

let db: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle>;

if (isPgBouncer) {
  // PgBouncer path: use postgres.js with prepare:false to avoid prepared stmts
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres");
  const { drizzle } = require("drizzle-orm/postgres-js");
  const client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
} else {
  // Direct connection path: standard pg Pool
  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: connectionString || undefined });
  db = drizzle(pool, { schema });
}

export { db };
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
