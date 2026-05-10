"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
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

    const existing = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      await tx.financialAccount.updateMany({
        where: { userId: { in: coupleUserIds }, isSalaryAccount: true },
        data: { isSalaryAccount: false },
      });

      return tx.financialAccount.update({
        where: { id: accountId },
        data: { isSalaryAccount: true },
      });
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

    const existing = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data: { isPinned: !existing.isPinned },
    });

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

    const existing = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    if (existing.isEmergencyFund) {
      return { success: false as const, error: "Already tagged as emergency fund" };
    }

    const efCount = await prisma.financialAccount.count({
      where: { userId: { in: coupleUserIds }, isEmergencyFund: true },
    });
    if (efCount >= 2) {
      return { success: false as const, error: "Maximum 2 emergency fund accounts allowed" };
    }

    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data: { isEmergencyFund: true },
    });

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

    const existing = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data: { isEmergencyFund: false },
    });

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
