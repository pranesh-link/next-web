/**
 * Export all data from Prisma Accelerate and import directly into Supabase.
 * Uses pg directly — no Prisma client required (works in Codespaces without generate).
 *
 * Usage in Codespaces:
 *   export BACKING_DB_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
 *   export SUPABASE_DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-1-...pooler.supabase.com:5432/postgres"
 *   npx tsx scripts/export-to-supabase.ts
 */

import { Client } from "pg";

const BACKING_DB_URL = process.env.BACKING_DB_URL;
const SUPABASE_URL = process.env.SUPABASE_DIRECT_URL ?? process.env.SUPABASE_URL;

if (!BACKING_DB_URL) { console.error("Set BACKING_DB_URL env var first"); process.exit(1); }
if (!SUPABASE_URL) { console.error("Set SUPABASE_DIRECT_URL env var first"); process.exit(1); }

// Tables in dependency order (parents before children)
const TABLES = [
  "users", "auth_accounts", "sessions", "verification_tokens",
  "Couple", "couple_members", "couple_invites",
  "financial_accounts", "balance_history", "overall_balance_log",
  "transactions", "investment_holdings", "deposit_instruments",
  "deposit_installments", "budgets", "budget_plans", "loans",
  "savings_goals", "body_profiles", "body_metrics",
  "nutrition_logs", "exercise_logs", "sleep_logs", "habits", "habit_logs",
  "couple_messages", "couple_chats", "couple_chat_messages",
  "trips", "trip_itinerary_items", "trip_expenses", "trip_checklist",
  "notifications", "device_tokens", "app_config", "app_errors",
];

async function main() {
  const src = new Client({ connectionString: BACKING_DB_URL, ssl: { rejectUnauthorized: false } });
  const dst = new Client({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });

  console.log("Connecting to source (Prisma Accelerate)...");
  await src.connect();
  console.log("Connecting to destination (Supabase)...");
  await dst.connect();

  // Disable FK checks during import
  await dst.query("SET session_replication_role = replica");

  // Truncate all tables in reverse order (children before parents) for clean re-import
  console.log("\nTruncating Supabase tables...");
  const truncateOrder = [...TABLES].reverse();
  for (const table of truncateOrder) {
    try {
      await dst.query(`TRUNCATE TABLE "${table}" CASCADE`);
      process.stdout.write(".");
    } catch { /* table may not exist yet, skip */ }
  }
  console.log(" done\n");

  let totalRows = 0;

  for (const table of TABLES) {
    process.stdout.write(`  ${table}... `);
    let rows: Record<string, unknown>[];
    try {
      const result = await src.query(`SELECT * FROM "${table}"`);
      rows = result.rows;
    } catch {
      console.log("(skip — not found in source)");
      continue;
    }

    if (rows.length === 0) { console.log("0 rows"); continue; }

    const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(", ");
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const numCols = Object.keys(batch[0]).length;
      const values = batch.map((_, ri) => {
        const placeholders = Array.from({ length: numCols }, (__, ci) => `$${ri * numCols + ci + 1}`).join(", ");
        return `(${placeholders})`;
      }).join(", ");
      // Pass arrays as-is (pg handles JS arrays as Postgres arrays natively).
      // Only JSON.stringify plain objects (not arrays, not Dates).
      const params = batch.flatMap(row =>
        Object.values(row).map(v => {
          if (v === null || v === undefined || v instanceof Date || typeof v !== "object") return v;
          if (Array.isArray(v)) return v; // pg serializes JS arrays → Postgres arrays
          return JSON.stringify(v);       // plain objects → jsonb
        })
      );
      try {
        await dst.query(
          `INSERT INTO "${table}" (${cols}) VALUES ${values} ON CONFLICT DO NOTHING`,
          params
        );
        inserted += batch.length;
      } catch (e) {
        console.error(`\n  ❌ Error inserting into ${table}:`, (e as Error).message);
        break;
      }
    }
    console.log(`${inserted}/${rows.length} rows`);
    totalRows += inserted;
  }

  await dst.query("SET session_replication_role = DEFAULT");
  await src.end();
  await dst.end();

  console.log(`\n✅ Done — ${totalRows} total rows imported to Supabase`);
}

main().catch(e => { console.error(e); process.exit(1); });
