/**
 * Re-exports from the db schema.
 * At build time, db/schema.ts is copied into the Docker context as db/schema.ts
 * relative to the api/ workdir, so this resolves to ../../db/schema.ts → /app/db/schema.ts.
 */
export * from "../../db/schema.js";
