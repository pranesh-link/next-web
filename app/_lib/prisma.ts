import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  // Use DIRECT_URL for migrations and schema introspection.
  // Use DATABASE_URL (Supabase Transaction Pooler, port 6543) for all
  // application queries. The pooler multiplexes connections across
  // serverless invocations so Postgres never sees more connections than
  // the pool size (default 15 per project on Supabase free tier).
  // connection_limit=1 + pool_timeout=10 are retained as a safety net
  // for local/CI environments that use a direct connection string.
  const base = process.env.DATABASE_URL ?? "";
  const sep = base.includes("?") ? "&" : "?";
  const connectionString = base
    ? `${base}${sep}connection_limit=1&pool_timeout=10`
    : base;

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString || undefined }),
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Alias for NextAuth adapter compatibility
export const prismaBase = prisma;
export default prisma;
