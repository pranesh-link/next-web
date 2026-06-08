/**
 * Drizzle database client — Phase 2 replacement for app/_lib/prisma.ts.
 *
 * Uses drizzle-orm/pg with the same `pg` package already in package.json.
 * Points at the Supabase Transaction Pooler (DATABASE_URL, port 6543)
 * which handles all connection multiplexing — no P2037 regardless of
 * concurrent Vercel invocations.
 *
 * Cold start: ~5ms (no Rust binary) vs ~100ms for Prisma+PrismaPg.
 *
 * During the Prisma → Drizzle migration, import from here for any new
 * code; existing Prisma imports remain untouched until each module is
 * migrated.
 */

import { drizzle } from "drizzle-orm/pg";
import { Pool } from "pg";
import * as schema from "./schema";

// connection_limit=1 is kept as safety net for local/CI environments
// that use a direct connection string instead of the Supabase pooler.
const base = process.env.DATABASE_URL ?? "";
const sep = base.includes("?") ? "&" : "?";
const connectionString = base ? `${base}${sep}connection_limit=1` : base;

const pool = new Pool({ connectionString: connectionString || undefined });

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Re-export schema for convenience
export * from "./schema";
