import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use DIRECT_DATABASE_URL for migrations — Supabase Transaction Pooler
    // (port 6543) blocks DDL statements in pgbouncer transaction mode.
    // Migrations must run against the direct connection (port 5432).
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
