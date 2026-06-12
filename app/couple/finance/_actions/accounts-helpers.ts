import { db } from "@db";
import { financialAccounts, overallBalanceLog } from "@db/schema";
import { inArray, sum } from "drizzle-orm";

type BalanceChangeReason = "ACCOUNT_ADDED" | "ACCOUNT_REMOVED" | "BALANCE_UPDATED";

/**
 * Aggregate the couple's total balance and append an entry to overallBalanceLog.
 *
 * Internal helper used by account mutations to keep an audit trail of the
 * couple-wide balance whenever an account is added, removed, or its balance
 * is updated.
 *
 * @param coupleUserIds - All user ids belonging to the couple (used to aggregate the latest total).
 * @param userId - Id of the user performing the change.
 * @param coupleId - Couple id when the user is part of a couple, otherwise `null`.
 * @param accountId - Id of the affected account, or `null` when the account no longer exists (e.g. removal).
 * @param accountName - Display name of the affected account, captured at the time of the change.
 * @param reason - Categorical reason for the change (see {@link BalanceChangeReason}).
 * @param change - Signed delta applied to the couple's total balance (negative for outflows / removals).
 * @returns Resolves when the log entry has been written.
 */
export async function logOverallBalanceChange(
  coupleUserIds: string[],
  userId: string,
  coupleId: string | null,
  accountId: string | null,
  accountName: string,
  reason: BalanceChangeReason,
  change: number,
) {
  const [{ total }] = await db
    .select({ total: sum(financialAccounts.balance) })
    .from(financialAccounts)
    .where(inArray(financialAccounts.userId, coupleUserIds));
  const totalBalance = Number(total ?? 0);

  await db.insert(overallBalanceLog).values({
    coupleId: coupleId || null,
    userId,
    accountId,
    accountName,
    reason,
    change,
    totalBalance,
  });
}
