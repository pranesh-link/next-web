import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  // On Vercel serverless each cold start creates a new process. Without a
  // pool size cap, concurrent invocations exhaust the Postgres connection
  // limit (P2037). connection_limit=1 keeps each serverless function to a
  // single connection; pool_timeout=10 prevents hangs on saturated DBs.
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set("connection_limit", "1");
  url.searchParams.set("pool_timeout", "10");

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString() }),
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Alias for NextAuth adapter compatibility
export const prismaBase = prisma;
export default prisma;
