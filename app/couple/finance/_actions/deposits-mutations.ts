"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { depositSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { invalidateAfterDepositChange } from "@/_lib/cache";
import {
  type InstallmentFrequency,
  parseDate,
  calculateMaturityAmount,
  getNextScheduledInstallmentDate,
  formatActionError,
} from "./deposits-helpers";

/**
 * Create a new deposit instrument (RD or FD) for the signed-in user.
 *
 * @param data - Deposit fields including type, principal, rate, tenure, and (for RDs) installment configuration.
 * @returns The created deposit on success; an error result with optional `validationErrors` on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/deposits`.
 */
export async function createDeposit(data: {
  name: string;
  provider?: string;
  type: "RECURRING_DEPOSIT" | "FIXED_DEPOSIT";
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  installmentAmount?: number;
  installmentFrequency?: InstallmentFrequency;
  paidInstallments?: number;
  totalInstallments?: number;
  startDate: string | Date;
  maturityDate: string | Date;
  nextInstallmentDate?: string | Date;
  sourceAccountId?: string;
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = depositSchema.parse(data);
    const coupleId = await getCoupleIdForUser(user.id);
    const maturityAmount = calculateMaturityAmount({
      type: validated.type,
      principalAmount: validated.principalAmount,
      interestRate: validated.interestRate,
      tenureMonths: validated.tenureMonths,
      installmentAmount: validated.installmentAmount,
      totalInstallments: validated.totalInstallments,
    });
    const nextInstallmentDate = validated.type === "RECURRING_DEPOSIT"
      ? getNextScheduledInstallmentDate({
          startDate: validated.startDate,
          totalInstallments: validated.totalInstallments,
          installmentFrequency: validated.installmentFrequency,
        })
      : validated.nextInstallmentDate;

    const deposit = await prisma.depositInstrument.create({
      data: {
        userId: user.id,
        name: validated.name,
        provider: validated.provider,
        type: validated.type,
        principalAmount: validated.principalAmount,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        installmentAmount: validated.installmentAmount,
        installmentFrequency: validated.installmentFrequency,
        paidInstallments: validated.paidInstallments,
        totalInstallments: validated.totalInstallments,
        startDate: validated.startDate,
        maturityDate: validated.maturityDate,
        maturityAmount,
        nextInstallmentDate,
        sourceAccountId: validated.sourceAccountId,
        ...(coupleId ? { coupleId } : {}),
      },
    });

    invalidateAfterDepositChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/deposits");
    return { success: true as const, data: deposit };
  } catch (error) {
    return {
      success: false as const,
      ...formatActionError(error, "Failed to create deposit"),
    };
  }
}

/**
 * Update an existing deposit. Partial fields are merged against the existing record before validation; maturity amount, next installment date, and status are recomputed.
 *
 * @param id - Deposit id.
 * @param data - Partial set of fields to update.
 * @returns The updated deposit on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/deposits`.
 */
export async function updateDeposit(
  id: string,
  data: {
    name?: string;
    provider?: string;
    type?: "RECURRING_DEPOSIT" | "FIXED_DEPOSIT";
    principalAmount?: number;
    interestRate?: number;
    tenureMonths?: number;
    installmentAmount?: number;
    installmentFrequency?: InstallmentFrequency;
    paidInstallments?: number;
    totalInstallments?: number;
    startDate?: string | Date;
    maturityDate?: string | Date;
    nextInstallmentDate?: string | Date;
  },
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.depositInstrument.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Deposit not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      provider: data.provider ?? (existing.provider ?? undefined),
      type: data.type ?? existing.type,
      principalAmount: data.principalAmount ?? existing.principalAmount,
      interestRate: data.interestRate ?? existing.interestRate,
      tenureMonths: data.tenureMonths ?? existing.tenureMonths,
      installmentAmount: data.installmentAmount ?? (existing.installmentAmount ?? undefined),
      installmentFrequency: data.installmentFrequency ?? existing.installmentFrequency,
      paidInstallments: data.paidInstallments ?? existing.paidInstallments,
      totalInstallments: data.totalInstallments ?? (existing.totalInstallments ?? undefined),
      startDate: data.startDate ?? existing.startDate,
      maturityDate: data.maturityDate ?? existing.maturityDate,
      nextInstallmentDate: data.nextInstallmentDate ?? (existing.nextInstallmentDate ?? undefined),
      sourceAccountId: existing.sourceAccountId ?? undefined,
    };

    const validated = depositSchema.parse(merged);
    const maturityAmount = calculateMaturityAmount({
      type: validated.type,
      principalAmount: validated.principalAmount,
      interestRate: validated.interestRate,
      tenureMonths: validated.tenureMonths,
      installmentAmount: validated.installmentAmount,
      totalInstallments: validated.totalInstallments,
    });
    const nextInstallmentDate = validated.type === "RECURRING_DEPOSIT"
      ? getNextScheduledInstallmentDate({
          startDate: validated.startDate,
          totalInstallments: validated.totalInstallments,
          installmentFrequency: validated.installmentFrequency,
        })
      : validated.nextInstallmentDate;

    const status = parseDate(validated.maturityDate) <= new Date() ? "MATURED" : "ACTIVE";

    const updated = await prisma.depositInstrument.update({
      where: { id },
      data: {
        name: validated.name,
        provider: validated.provider,
        type: validated.type,
        principalAmount: validated.principalAmount,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        installmentAmount: validated.installmentAmount,
        installmentFrequency: validated.installmentFrequency,
        paidInstallments: validated.paidInstallments,
        totalInstallments: validated.totalInstallments,
        startDate: validated.startDate,
        maturityDate: validated.maturityDate,
        maturityAmount,
        nextInstallmentDate,
        status,
      },
    });

    invalidateAfterDepositChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/deposits");
    return { success: true as const, data: updated };
  } catch (error) {
    return {
      success: false as const,
      ...formatActionError(error, "Failed to update deposit"),
    };
  }
}

/**
 * Permanently delete a deposit instrument owned by the couple.
 *
 * @param id - Deposit id.
 * @returns Result containing `{ id }` on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/deposits`.
 */
export async function deleteDeposit(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.depositInstrument.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Deposit not found" };
    }

    await prisma.depositInstrument.delete({ where: { id } });

    invalidateAfterDepositChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/deposits");
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete deposit",
    };
  }
}
