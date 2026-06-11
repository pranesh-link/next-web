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

/** Returns a map of column_name → 'json' | 'array' | 'other' for a table. */
async function getColumnTypes(client: Client, table: string): Promise<Map<string, string>> {
  const result = await client.query(
    `SELECT column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  const map = new Map<string, string>();
  for (const row of result.rows) {
    if (row.data_type === "ARRAY") map.set(row.column_name, "array");
    else if (row.udt_name === "json" || row.udt_name === "jsonb") map.set(row.column_name, "json");
    else map.set(row.column_name, "other");
  }
  return map;
}

async function main() {
  const src = new Client({ connectionString: BACKING_DB_URL, ssl: { rejectUnauthorized: false } });
  const dst = new Client({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });

  console.log("Connecting to source (Prisma Accelerate)...");
  await src.connect();
  console.log("Connecting to destination (Supabase)...");
  await dst.connect();

  await dst.query("SET session_replication_role = replica");

  // Truncate all tables in reverse order for clean re-import
  console.log("\nTruncating Supabase tables...");
  for (const table of [...TABLES].reverse()) {
    try { await dst.query(`TRUNCATE TABLE "${table}" CASCADE`); process.stdout.write("."); }
    catch { /* skip if not found */ }
  }
  console.log(" done\n");

  let totalRows = 0;

  for (const table of TABLES) {
    process.stdout.write(`  ${table}... `);
    let rows: Record<string, unknown>[];
    try {
      rows = (await src.query(`SELECT * FROM "${table}"`)).rows;
    } catch {
      console.log("(skip — not found in source)");
      continue;
    }
    if (rows.length === 0) { console.log("0 rows"); continue; }

    // Get destination column types so we know how to serialize each value
    const colTypes = await getColumnTypes(dst, table.toLowerCase());

    const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(", ");
    let inserted = 0;

    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const numCols = Object.keys(batch[0]).length;
      const values = batch.map((_, ri) =>
        `(${Array.from({ length: numCols }, (__, ci) => `$${ri * numCols + ci + 1}`).join(", ")})`
      ).join(", ");

      const params = batch.flatMap(row =>
        Object.entries(row).map(([col, v]) => {
          if (v === null || v === undefined || v instanceof Date || typeof v !== "object") return v;
          const colType = colTypes.get(col.toLowerCase()) ?? "other";
          if (colType === "array") return v;        // Postgres array column → pass JS array
          return JSON.stringify(v);                  // json/jsonb column → serialize
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
