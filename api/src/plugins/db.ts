/**
 * Shared Drizzle DB client for the Fastify server.
 * Imports directly from the monorepo db/ package.
 * Single persistent Pool — key advantage over Vercel serverless.
 */
export { db } from "../../db/index.js";
export type { DB } from "../../db/index.js";
