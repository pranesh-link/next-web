import { NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { db } from "@db";
import { financialAccounts, loans, coupleMembers, users } from "@db/schema";
import { eq, count } from "drizzle-orm";

/**
 * Temporary diagnostic endpoint.
 * Visit /api/debug/session to see session userId and DB record counts.
 * Remove this file once the empty-data issue is diagnosed.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const [accountCountResult, loanCountResult, coupleMemberRecord, userRecord] = await Promise.all([
    db.select({ count: count() }).from(financialAccounts).where(eq(financialAccounts.userId, userId)),
    db.select({ count: count() }).from(loans).where(eq(loans.userId, userId)),
    // Select only from couple_members (no join to couples) so this works even
    // when the couples table is missing.
    db.query.coupleMembers.findFirst({
      where: eq(coupleMembers.userId, userId),
      columns: { id: true, coupleId: true },
    }),
    db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true, email: true, name: true } }),
  ]);

  const accountCount = accountCountResult[0]?.count ?? 0;
  const loanCount = loanCountResult[0]?.count ?? 0;

  return NextResponse.json({
    sessionUserId: userId,
    userRecord,
    accountCount,
    loanCount,
    coupleId: coupleMemberRecord?.coupleId ?? null,
    hint: accountCount === 0
      ? "No accounts found for this userId — data may be stored under a different userId"
      : "Accounts found — data is accessible",
  });
}
