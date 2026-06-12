/**
 * Runs all *.sql files in scripts/migrations/ against the database.
 * Uses pg directly so it works from GitHub Actions (no psql IPv6 issues).
 * Requires DATABASE_URL or DIRECT_DATABASE_URL env var.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Client } from "pg";
import { setDefaultResultOrder } from "dns";

// Force IPv4 — GitHub Actions has no IPv6 connectivity
setDefaultResultOrder("ipv4first");

async function main() {
  const connectionString =
    process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

  if (!connectionString) {
    console.error("No DATABASE_URL or DIRECT_DATABASE_URL set");
    process.exit(1);
  }

  // Strip sslmode=no-verify (pg uses ssl config object instead)
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]$/, "");

  const migrationsDir = join(process.cwd(), "scripts/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No SQL migrations found.");
    return;
  }

  const client = new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to database.");

  for (const file of files) {
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, "utf-8");
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log(`Done: ${file}`);
  }

  await client.end();
  console.log("All migrations completed successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
