"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { loanSchema } from "@/_lib/validations/finance";
import { calculateEMI } from "@/_services/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { invalidateAfterLoanChange } from "@/_lib/cache";

type ScheduleRow = { month: number; date: string; emi: number; principal: number; interest: number; balance: number };
type PrepaymentRow = { date: string; amount: number; balanceAfter?: number };

/**
 * Create a loan, computing EMI when omitted and rejecting duplicates by account number (or by the (name, principal, rate, tenure) tuple).
 *
 * @param data - Loan fields. `prepayments` and `schedule` are optional and stored as JSON.
 * @returns The created loan on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/loans`, and `/couple/finance/budget-planner`.
 */
export async function createLoan(data: {
  name: string;
  loanProvider?: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string | Date;
  remainingBalance: number;
  loanAccountNumber?: string;
  scheduleGeneratedOn?: string;
  prepayments?: PrepaymentRow[];
  schedule?: ScheduleRow[];
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const duplicate = data.loanAccountNumber
      ? await prisma.loan.findFirst({
          where: { userId: { in: coupleUserIds }, loanAccountNumber: data.loanAccountNumber },
        })
      : await prisma.loan.findFirst({
          where: {
            userId: { in: coupleUserIds },
            name: data.name,
            principal: data.principal,
            interestRate: data.interestRate,
            tenureMonths: data.tenureMonths,
          },
        });

    if (duplicate) {
      return {
        success: false as const,
        error: data.loanAccountNumber
          ? `A loan with account number "${data.loanAccountNumber}" already exists`
          : `A loan "${data.name}" with the same principal, rate, and tenure already exists`,
      };
    }

    let emiAmount = data.emiAmount;
    if (emiAmount === 0) {
      emiAmount = calculateEMI(data.principal, data.interestRate, data.tenureMonths);
    }

    const validated = loanSchema.parse({ ...data, emiAmount });
    const coupleId = await getCoupleIdForUser(user.id);

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        name: validated.name,
        loanProvider: validated.loanProvider || null,
        loanAccountNumber: validated.loanAccountNumber || null,
        scheduleGeneratedOn: validated.scheduleGeneratedOn || null,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
        ...(validated.prepayments && validated.prepayments.length > 0
          ? { prepayments: validated.prepayments }
          : {}),
        ...(validated.schedule && validated.schedule.length > 0
          ? { schedule: validated.schedule }
          : {}),
        ...(coupleId ? { coupleId } : {}),
      },
    });

    invalidateAfterLoanChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/loans");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: loan };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create loan",
    };
  }
}

/**
 * Update a loan. Manual prepayments are preserved; supplied `prepayments` replace any existing scanned entries. Partial fields are merged with the existing record before validation.
 *
 * @param id - Loan id.
 * @param data - Partial set of fields to update.
 * @returns The updated loan on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/loans`, and `/couple/finance/budget-planner`.
 */
export async function updateLoan(
  id: string,
  data: {
    name?: string;
    loanProvider?: string;
    principal?: number;
    interestRate?: number;
    tenureMonths?: number;
    emiAmount?: number;
    startDate?: string | Date;
    remainingBalance?: number;
    loanAccountNumber?: string;
    scheduleGeneratedOn?: string;
    prepayments?: PrepaymentRow[];
    schedule?: ScheduleRow[];
  },
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Loan not found" };
    }

    let mergedPrepayments =
      (existing.prepayments as (PrepaymentRow & { source?: string })[] | null) ?? [];
    if (data.prepayments) {
      const manualEntries = mergedPrepayments.filter((p) => p.source !== "scanned");
      mergedPrepayments = [...manualEntries, ...data.prepayments];
    }

    const merged = {
      name: data.name ?? existing.name,
      loanProvider: data.loanProvider ?? (existing.loanProvider ?? undefined),
      loanAccountNumber: data.loanAccountNumber ?? (existing.loanAccountNumber ?? undefined),
      scheduleGeneratedOn: data.scheduleGeneratedOn ?? (existing.scheduleGeneratedOn ?? undefined),
      principal: data.principal ?? existing.principal,
      interestRate: data.interestRate ?? existing.interestRate,
      tenureMonths: data.tenureMonths ?? existing.tenureMonths,
      emiAmount: data.emiAmount ?? existing.emiAmount,
      startDate: data.startDate ?? existing.startDate,
      remainingBalance: data.remainingBalance ?? existing.remainingBalance,
      prepayments: mergedPrepayments.length > 0 ? mergedPrepayments : undefined,
      schedule:
        data.schedule ?? (existing.schedule as ScheduleRow[] | null) ?? undefined,
    };

    const validated = loanSchema.parse(merged);

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        name: validated.name,
        loanProvider: validated.loanProvider || null,
        loanAccountNumber: validated.loanAccountNumber || null,
        scheduleGeneratedOn: validated.scheduleGeneratedOn || null,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
        prepayments:
          validated.prepayments && validated.prepayments.length > 0
            ? validated.prepayments
            : undefined,
        schedule:
          validated.schedule && validated.schedule.length > 0
            ? validated.schedule
            : undefined,
      },
    });

    invalidateAfterLoanChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/loans");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: loan };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update loan",
    };
  }
}

/**
 * Permanently delete a loan owned by the couple.
 *
 * @param id - Loan id.
 * @returns Result containing `{ id }` on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/loans`, and `/couple/finance/budget-planner`.
 */
export async function deleteLoan(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Loan not found" };
    }

    await prisma.loan.delete({ where: { id } });

    invalidateAfterLoanChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/loans");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete loan",
    };
  }
}
