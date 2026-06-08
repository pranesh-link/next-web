import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Always use the direct connection for migrations — pooler (port 6543)
    // blocks DDL statements in pgbouncer transaction mode.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
