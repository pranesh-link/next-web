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
 * IMPORTANT: Do NOT use DATABASE_URL_POOLER with PgBouncer (port 6543).
 * PgBouncer Transaction mode does not support prepared statements, which
 * drizzle-orm/node-postgres uses by default. Use the DIRECT connection
 * (port 5432) for DATABASE_URL_POOLER to avoid "prepared statement" errors.
 *
 * Alternatively, leave DATABASE_URL_POOLER unset and Drizzle will fall
 * back to DATABASE_URL (also direct connection).
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL_POOLER ?? process.env.DATABASE_URL ?? "";

// Strip pgbouncer and Prisma-specific schema param so pg driver doesn't reject
// the URL. The ?schema=public param is Prisma-only; pg ignores it but it can
// confuse some drivers. We set search_path explicitly via options instead.
const cleanUrl = connectionString
  .replace(/[?&]pgbouncer=true/g, "")
  .replace(/[?&]schema=[^&]*/g, "")
  .replace(/[?&]$/, "");

// Supabase's SSL cert chain is not always in Node.js's built-in CA bundle.
// Disable cert verification for the Drizzle pool — the connection is still
// encrypted (TLS), we just skip hostname/chain verification. This matches
// what Prisma does internally for Supabase connections.
const pool = new Pool({
  connectionString: cleanUrl || undefined,
  ssl: { rejectUnauthorized: false },
});

// Set search_path=public on every new connection.
// The Pool constructor's `options` field is not reliably applied in all
// pg versions. Using a 'connect' event listener is the most reliable way
// to ensure every connection targets the public schema — same approach
// used by @prisma/adapter-pg internally.
pool.on("connect", (client) => {
  client.query("SET search_path TO public").catch(() => {});
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
