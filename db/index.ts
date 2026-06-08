/**
 * Drizzle database client — Phase 2 replacement for app/_lib/prisma.ts.
 *
 * Uses @neondatabase/serverless HTTP driver which sends each query as
 * an HTTPS request. No TCP connection pool — P2037 is structurally
 * impossible. Cold start overhead: ~5ms vs ~100ms for Prisma+PrismaPg.
 *
 * During the Prisma → Drizzle migration, import from here for any new
 * code; existing Prisma imports remain untouched until each module is
 * migrated.
 *
 * To use with Supabase (current): set DATABASE_URL to the Transaction
 * Pooler URL (port 6543, ?pgbouncer=true). The neon() driver will use
 * HTTP mode which bypasses pgbouncer entirely.
 *
 * To use with Neon (Phase 3): swap DATABASE_URL to the Neon connection
 * string — no other code change needed.
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Safe at build time — neon() call is lazy (no connection until first query)
const sql = neon(process.env.DATABASE_URL ?? "");

export const db = drizzle(sql, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
