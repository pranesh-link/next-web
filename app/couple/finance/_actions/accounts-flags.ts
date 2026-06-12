"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { financialAccounts } from "@db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { invalidateAfterAccountChange } from "@/_lib/cache";

/**
 * Mark an account as the couple's salary account, atomically clearing the flag from any other account.
 *
 * @param accountId - The account to tag as the salary account.
 * @returns The updated account on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function setSalaryAccount(accountId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const updatedAccount = await db.transaction(async (tx) => {
      await tx
        .update(financialAccounts)
        .set({ isSalaryAccount: false })
        .where(
          and(
            inArray(financialAccounts.userId, coupleUserIds),
            eq(financialAccounts.isSalaryAccount, true),
          ),
        );

      const [account] = await tx
        .update(financialAccounts)
        .set({ isSalaryAccount: true })
        .where(eq(financialAccounts.id, accountId))
        .returning();
      return account;
    });

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: updatedAccount };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to set salary account",
    };
  }
}

/**
 * Toggle the `isPinned` flag on an account.
 *
 * @param accountId - The account to pin or unpin.
 * @returns The updated account on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function togglePinAccount(accountId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const [account] = await db
      .update(financialAccounts)
      .set({ isPinned: !existing.isPinned })
      .where(eq(financialAccounts.id, accountId))
      .returning();

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to toggle pin",
    };
  }
}

/**
 * Tag an account as an emergency-fund account, enforcing a per-couple limit of 2.
 *
 * @param accountId - The account to tag.
 * @returns The updated account on success; an error result on failure (already tagged or limit reached).
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function setEmergencyFundAccount(accountId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    if (existing.isEmergencyFund) {
      return { success: false as const, error: "Already tagged as emergency fund" };
    }

    const [{ efCount }] = await db
      .select({ efCount: count() })
      .from(financialAccounts)
      .where(
        and(
          inArray(financialAccounts.userId, coupleUserIds),
          eq(financialAccounts.isEmergencyFund, true),
        ),
      );
    if (efCount >= 2) {
      return { success: false as const, error: "Maximum 2 emergency fund accounts allowed" };
    }

    const [account] = await db
      .update(financialAccounts)
      .set({ isEmergencyFund: true })
      .where(eq(financialAccounts.id, accountId))
      .returning();

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to set emergency fund",
    };
  }
}

/**
 * Remove the emergency-fund tag from an account.
 *
 * @param accountId - The account to untag.
 * @returns The updated account on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function unsetEmergencyFundAccount(accountId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const [account] = await db
      .update(financialAccounts)
      .set({ isEmergencyFund: false })
      .where(eq(financialAccounts.id, accountId))
      .returning();

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to unset emergency fund",
    };
  }
}
