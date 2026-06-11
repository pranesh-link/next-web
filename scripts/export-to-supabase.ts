/**
 * Export all data from Prisma Accelerate and import directly into Supabase.
 *
 * Usage in Codespaces:
 *   export BACKING_DB_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
 *   export SUPABASE_DIRECT_URL="postgresql://postgres.<ref>:<password>@db.<ref>.supabase.co:5432/postgres"
 *   npx tsx scripts/export-to-supabase.ts
 *
 * Run AFTER: DIRECT_DATABASE_URL="$SUPABASE_DIRECT_URL" npx prisma migrate deploy
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { Client } from "pg";

const BACKING_DB_URL = process.env.BACKING_DB_URL;
const SUPABASE_URL = process.env.SUPABASE_DIRECT_URL ?? process.env.SUPABASE_URL;

if (!BACKING_DB_URL) {
  console.error("Set BACKING_DB_URL env var first");
  process.exit(1);
}

// Escape a value for SQL INSERT
function sqlVal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function rowsToInserts(table: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `-- ${table}: no rows\n`;
  const cols = Object.keys(rows[0]).map((c) => `"${c}"`).join(", ");
  const inserts = rows.map((row) => {
    const vals = Object.values(row).map(sqlVal).join(", ");
    return `INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`;
  });
  return `-- ${table}: ${rows.length} rows\n${inserts.join("\n")}\n`;
}

async function main() {
  // Prisma v7: URL must come from DATABASE_URL env var (constructor options removed)
  process.env.DATABASE_URL = BACKING_DB_URL;
  const prisma = new PrismaClient();
  const lines: string[] = [
    "-- LuvVerse data export",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Apply to Supabase AFTER running: npx prisma migrate deploy",
    "SET session_replication_role = replica; -- disable FK checks during import",
    "",
  ];

  console.log("Connecting to Prisma Accelerate...");

  try {
    // Export in dependency order (parents before children)
    const exports: [string, () => Promise<unknown[]>][] = [
      ["User", () => prisma.user.findMany()],
      ["Account", () => prisma.account.findMany()],
      ["Session", () => prisma.session.findMany()],
      ["VerificationToken", () => prisma.verificationToken.findMany()],
      ["Couple", () => prisma.couple.findMany()],
      ["CoupleMember", () => prisma.coupleMember.findMany()],
      ["CoupleInvite", () => prisma.coupleInvite.findMany()],
      ["FinancialAccount", () => prisma.financialAccount.findMany()],
      ["BalanceHistory", () => prisma.balanceHistory.findMany()],
      ["OverallBalanceLog", () => prisma.overallBalanceLog.findMany()],
      ["Transaction", () => prisma.transaction.findMany()],
      ["InvestmentHolding", () => prisma.investmentHolding.findMany()],
      ["DepositInstrument", () => prisma.depositInstrument.findMany()],
      ["DepositInstallment", () => prisma.depositInstallment.findMany()],
      ["Budget", () => prisma.budget.findMany()],
      ["BudgetPlan", () => prisma.budgetPlan.findMany()],
      ["Loan", () => prisma.loan.findMany()],
      ["SavingsGoal", () => prisma.savingsGoal.findMany()],
      ["BodyProfile", () => prisma.bodyProfile.findMany()],
      ["BodyMetric", () => prisma.bodyMetric.findMany()],
      ["NutritionLog", () => prisma.nutritionLog.findMany()],
      ["ExerciseLog", () => prisma.exerciseLog.findMany()],
      ["SleepLog", () => prisma.sleepLog.findMany()],
      ["Habit", () => prisma.habit.findMany()],
      ["HabitLog", () => prisma.habitLog.findMany()],
      ["CoupleMessage", () => prisma.coupleMessage.findMany()],
      ["CoupleChat", () => prisma.coupleChat.findMany()],
      ["CoupleChatMsg", () => prisma.coupleChatMsg.findMany()],
      ["Trip", () => prisma.trip.findMany()],
      ["TripItineraryItem", () => prisma.tripItineraryItem.findMany()],
      ["TripExpense", () => prisma.tripExpense.findMany()],
      ["TripChecklist", () => prisma.tripChecklist.findMany()],
      ["Notification", () => prisma.notification.findMany()],
      ["DeviceToken", () => prisma.deviceToken.findMany()],
      ["AppConfig", () => prisma.appConfig.findMany()],
      ["AppError", () => prisma.appError.findMany()],
    ];

    let totalRows = 0;
    for (const [model, fetchFn] of exports) {
      process.stdout.write(`  Exporting ${model}... `);
      const rows = await fetchFn() as Record<string, unknown>[];
      console.log(`${rows.length} rows`);
      lines.push(rowsToInserts(model, rows));
      totalRows += rows.length;
    }

    lines.push("\nSET session_replication_role = DEFAULT;");

    const outFile = "/tmp/luvverse_export.sql";
    writeFileSync(outFile, lines.join("\n"), "utf-8");
    console.log(`\n✅ Exported ${totalRows} total rows → ${outFile}`);

    if (SUPABASE_URL) {
      console.log("\nApplying to Supabase...");
      const pg = new Client({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });
      await pg.connect();
      const sql = lines.join("\n");
      await pg.query(sql);
      await pg.end();
      console.log("✅ Data imported to Supabase successfully");
    } else {
      console.log(`\nTo import to Supabase, run:`);
      console.log(`  psql "$SUPABASE_URL" -f /tmp/luvverse_export.sql`);
    }

  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
