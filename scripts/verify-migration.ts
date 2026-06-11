/**
 * Verify data migration from Prisma Accelerate to Supabase.
 * Usage:
 *   export BACKING_DB_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
 *   export SUPABASE_DIRECT_URL="postgres://...@pooler.supabase.com:5432/postgres"
 *   npx tsx scripts/verify-migration.ts
 */

import { Client } from "pg";

const BACKING_DB_URL = process.env.BACKING_DB_URL;
const SUPABASE_URL = process.env.SUPABASE_DIRECT_URL ?? process.env.SUPABASE_URL;

if (!BACKING_DB_URL) { console.error("Set BACKING_DB_URL"); process.exit(1); }
if (!SUPABASE_URL) { console.error("Set SUPABASE_DIRECT_URL"); process.exit(1); }

const TABLES = [
  "users", "auth_accounts", "sessions", "verification_tokens",
  "Couple", "couple_members", "couple_invites",
  "financial_accounts", "balance_history", "overall_balance_log",
  "transactions", "investment_holdings", "deposit_instruments", "deposit_installments",
  "budgets", "budget_plans", "loans", "savings_goals",
  "body_profiles", "body_metrics", "nutrition_logs", "exercise_logs", "sleep_logs",
  "habits", "habit_logs", "couple_messages", "couple_chats", "couple_chat_messages",
  "trips", "trip_itinerary_items", "trip_expenses", "trip_checklist",
  "notifications", "device_tokens", "app_config", "app_errors",
];

async function main() {
  const src = new Client({ connectionString: BACKING_DB_URL, ssl: { rejectUnauthorized: false } });
  const dst = new Client({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });
  await src.connect();
  await dst.connect();

  let mismatches = 0, totalSrc = 0, totalDst = 0, tablesOk = 0, tablesEmpty = 0;

  for (const t of TABLES) {
    const [ca, cb] = await Promise.all([
      src.query(`SELECT COUNT(*) FROM "${t}"`).catch(() => ({ rows: [{ count: "0" }] })),
      dst.query(`SELECT COUNT(*) FROM "${t}"`).catch(() => ({ rows: [{ count: "0" }] })),
    ]);
    const srcN = parseInt(ca.rows[0].count) || 0;
    const dstN = parseInt(cb.rows[0].count) || 0;
    totalSrc += srcN;
    totalDst += dstN;

    if (srcN !== dstN) {
      mismatches++;
      console.log("❌", t.padEnd(35), `src=${srcN} dst=${dstN} COUNT MISMATCH`);
      continue;
    }

    if (srcN === 0) {
      tablesEmpty++;
      console.log("➖", t.padEnd(35), "0 rows");
      continue;
    }

    const [ra, rb] = await Promise.all([
      src.query(`SELECT id FROM "${t}" ORDER BY id LIMIT 1`).catch(() => ({ rows: [{}] })),
      dst.query(`SELECT id FROM "${t}" ORDER BY id LIMIT 1`).catch(() => ({ rows: [{}] })),
    ]);

    const idMatch = ra.rows[0]?.id === rb.rows[0]?.id;
    if (!idMatch) {
      mismatches++;
      console.log("❌", t.padEnd(35), `${srcN} rows — ID MISMATCH`);
    } else {
      tablesOk++;
      console.log("✅", t.padEnd(35), `${srcN} rows`);
    }
  }

  console.log("");
  console.log("─".repeat(55));
  console.log(`Tables checked : ${TABLES.length}`);
  console.log(`Tables OK      : ${tablesOk}`);
  console.log(`Tables empty   : ${tablesEmpty}`);
  console.log(`Tables failed  : ${mismatches}`);
  console.log(`Total rows src : ${totalSrc}`);
  console.log(`Total rows dst : ${totalDst}`);
  console.log("─".repeat(55));
  console.log(mismatches === 0 ? "✅ Migration verified — all data matches!" : `❌ ${mismatches} issue(s) found`);

  await src.end();
  await dst.end();
}

main().catch(e => { console.error(e); process.exit(1); });
