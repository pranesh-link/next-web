import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaBase: PrismaClient | undefined;
};

const DATABASE_URL = process.env.DATABASE_URL!;
const isAccelerate = DATABASE_URL.startsWith("prisma+postgres://");

function createBaseClient(): PrismaClient {
  if (isAccelerate) {
    // Accelerate URL — use accelerateUrl constructor option (Prisma v7 API).
    return new PrismaClient({ accelerateUrl: DATABASE_URL });
  }
  // Direct postgres URL — local dev.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });
}

// Raw client — required by PrismaAdapter (NextAuth). No $extends.
export const prismaBase: PrismaClient =
  globalForPrisma.prismaBase ?? createBaseClient();

// App client — with Accelerate extension for query caching in production.
export const prisma: PrismaClient = isAccelerate
  ? (prismaBase.$extends(withAccelerate()) as unknown as PrismaClient)
  : prismaBase;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = prismaBase;
  globalForPrisma.prisma = prisma;
}

export default prisma;
