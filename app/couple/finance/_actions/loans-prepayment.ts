"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { invalidateAfterLoanChange } from "@/_lib/cache";
import { updateLoanScheduleFromRawText } from "@/_services/finance/update-schedule-service";

type StoredPrepayment = { date: string; amount: number; balanceAfter?: number; source?: string };

/**
 * Add a manual prepayment to a loan and reduce its remaining balance.
 *
 * @param loanId - Loan id.
 * @param data - Prepayment payload (`date` ISO string between loan start and today; `amount` positive and ≤ remaining balance).
 * @returns `{ success: true }` on success; an error result on failure (validation, ownership, or balance violations).
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/loans`, and `/couple/finance/budget-planner`.
 */
export async function addPrepayment(loanId: string, data: { date: string; amount: number }) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId: { in: coupleUserIds } },
    });

    if (!loan) return { success: false as const, error: "Loan not found" };

    const prepayDate = new Date(data.date);
    const loanStart = new Date(loan.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    loanStart.setHours(0, 0, 0, 0);
    prepayDate.setHours(0, 0, 0, 0);

    if (prepayDate < loanStart || prepayDate > today) {
      return { success: false as const, error: "Prepayment date must be between loan start date and today" };
    }

    if (data.amount <= 0) {
      return { success: false as const, error: "Prepayment amount must be positive" };
    }

    if (data.amount > loan.remainingBalance) {
      return { success: false as const, error: "Prepayment amount exceeds remaining balance" };
    }

    const existing = Array.isArray(loan.prepayments)
      ? (loan.prepayments as StoredPrepayment[])
      : [];

    const newBalance = loan.remainingBalance - data.amount;

    const newPrepayment = {
      date: data.date,
      amount: data.amount,
      balanceAfter: Math.round(newBalance * 100) / 100,
      source: "manual" as const,
    };

    const updated = [...existing, newPrepayment].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    await prisma.loan.update({
      where: { id: loanId },
      data: {
        prepayments: updated,
        remainingBalance: Math.round(newBalance * 100) / 100,
      },
    });

    invalidateAfterLoanChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/loans");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to add prepayment",
    };
  }
}

/**
 * Remove a manual prepayment by index and restore its amount to the loan's remaining balance. Scanned prepayments cannot be removed.
 *
 * @param loanId - Loan id.
 * @param index - Index of the prepayment within the stored array.
 * @returns `{ success: true }` on success; an error result on failure (invalid index or scanned entry).
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/loans`, and `/couple/finance/budget-planner`.
 */
export async function removePrepayment(loanId: string, index: number) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId: { in: coupleUserIds } },
    });

    if (!loan) return { success: false as const, error: "Loan not found" };

    const existing = Array.isArray(loan.prepayments)
      ? (loan.prepayments as StoredPrepayment[])
      : [];

    if (index < 0 || index >= existing.length) {
      return { success: false as const, error: "Invalid prepayment index" };
    }

    const target = existing[index];

    if (!target.source || target.source === "scanned") {
      return {
        success: false as const,
        error: "Cannot remove scanned prepayments — they were extracted from your loan statement",
      };
    }

    const restoredBalance = loan.remainingBalance + target.amount;
    const updated = existing.filter((_, i) => i !== index);

    await prisma.loan.update({
      where: { id: loanId },
      data: {
        prepayments: updated.length > 0 ? updated : [],
        remainingBalance: Math.round(restoredBalance * 100) / 100,
      },
    });

    invalidateAfterLoanChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/loans");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to remove prepayment",
    };
  }
}

/**
 * Replace a loan's amortization schedule by parsing free-form text (e.g. pasted from a bank statement).
 *
 * @param loanId - Loan id.
 * @param rawScheduleText - Raw text whose rows describe the schedule entries.
 * @returns Result with `rowsExtracted` and `method` on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/loans`, and `/couple/finance/budget-planner`.
 */
export async function updateScheduleAction(loanId: string, rawScheduleText: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const result = await updateLoanScheduleFromRawText(user.id, loanId, rawScheduleText);

    if (!result.ok) {
      return { success: false as const, error: result.error };
    }

    invalidateAfterLoanChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/loans");
    revalidatePath("/couple/finance/budget-planner");

    return {
      success: true as const,
      rowsExtracted: result.body.rowsExtracted,
      method: result.body.method,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update schedule",
    };
  }
}
