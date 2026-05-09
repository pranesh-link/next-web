"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { depositSchema, depositInstallmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { createNotification } from "@/_services/finance/notification-service";
import { ZodError } from "zod";
import { invalidateAfterDepositChange } from "@/_lib/cache";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

type InstallmentFrequency = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

const FREQUENCY_MONTHS: Record<InstallmentFrequency, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
};

function toStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFrequencyMonths(frequency: InstallmentFrequency | null | undefined): number {
  return FREQUENCY_MONTHS[frequency ?? "MONTHLY"];
}

function addMonthsWithDayClamp(baseDate: Date, monthsToAdd: number, targetDayOfMonth: number): Date {
  const source = parseDate(baseDate);
  const targetYear = source.getFullYear();
  const targetMonth = source.getMonth() + monthsToAdd;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(targetDayOfMonth, lastDayOfTargetMonth);

  return new Date(targetYear, targetMonth, day);
}

function getScheduledInstallmentDate(
  startDate: Date,
  installmentNumber: number,
  frequency: InstallmentFrequency,
): Date {
  const normalizedStartDate = toStartOfDay(parseDate(startDate));
  const monthsToAdd = (installmentNumber - 1) * getFrequencyMonths(frequency);
  return addMonthsWithDayClamp(normalizedStartDate, monthsToAdd, normalizedStartDate.getDate());
}

function getNextScheduledInstallmentDate(input: {
  startDate: Date;
  totalInstallments?: number | null;
  installmentFrequency?: InstallmentFrequency | null;
  asOfDate?: Date;
}): Date | null {
  const totalInstallments = input.totalInstallments ?? 0;

  if (totalInstallments <= 0) {
    return null;
  }

  const frequency = input.installmentFrequency ?? "MONTHLY";
  const asOfDate = toStartOfDay(input.asOfDate ?? new Date());

  for (let installmentNumber = 1; installmentNumber <= totalInstallments; installmentNumber += 1) {
    const dueDate = getScheduledInstallmentDate(input.startDate, installmentNumber, frequency);
    if (dueDate >= asOfDate) {
      return dueDate;
    }
  }

  return null;
}

function getExpectedInstallmentsTillDate(input: {
  startDate: Date;
  totalInstallments?: number | null;
  installmentFrequency?: InstallmentFrequency | null;
  asOfDate?: Date;
}): number {
  const totalInstallments = input.totalInstallments ?? 0;

  if (totalInstallments <= 0) {
    return 0;
  }

  const frequency = input.installmentFrequency ?? "MONTHLY";
  const asOfDate = toStartOfDay(input.asOfDate ?? new Date());

  let expected = 0;

  for (let installmentNumber = 1; installmentNumber <= totalInstallments; installmentNumber += 1) {
    const dueDate = getScheduledInstallmentDate(input.startDate, installmentNumber, frequency);
    if (dueDate <= asOfDate) {
      expected = installmentNumber;
      continue;
    }

    break;
  }

  return Math.min(expected, totalInstallments);
}

function calculateMaturityAmount(input: {
  type: "RECURRING_DEPOSIT" | "FIXED_DEPOSIT";
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  installmentAmount?: number;
  totalInstallments?: number;
}) {
  const monthlyRate = input.interestRate / 1200;

  if (input.type === "RECURRING_DEPOSIT") {
    const installment = input.installmentAmount ?? 0;
    const installments = input.totalInstallments ?? input.tenureMonths;

    if (installment <= 0 || installments <= 0) {
      return Number(input.principalAmount.toFixed(2));
    }

    if (monthlyRate === 0) {
      return Number((installment * installments).toFixed(2));
    }

    // Future value of monthly annuity due (installment paid at period start).
    const fv = installment * ((Math.pow(1 + monthlyRate, installments) - 1) / monthlyRate) * (1 + monthlyRate);
    return Number(fv.toFixed(2));
  }

  const fv = input.principalAmount * Math.pow(1 + monthlyRate, input.tenureMonths);
  return Number(fv.toFixed(2));
}

function formatActionError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    const { fieldErrors, formErrors } = error.flatten();
    const normalizedFieldErrors: Record<string, string[]> = {};

    for (const [key, messages] of Object.entries(fieldErrors as Record<string, string[] | undefined>)) {
      if (messages && messages.length > 0) {
        normalizedFieldErrors[key] = messages;
      }
    }

    return {
      error: formErrors[0] ?? "Validation failed",
      validationErrors: normalizedFieldErrors,
    };
  }

  return {
    error: error instanceof Error ? error.message : fallback,
  };
}

export async function getDeposits() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const deposits = await prisma.depositInstrument.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { maturityDate: "asc" },
      include: {
        installments: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    const enrichedDeposits = deposits.map((deposit) => {
      if (deposit.type !== "RECURRING_DEPOSIT") {
        return deposit;
      }

      const expectedInstallmentsTillDate = getExpectedInstallmentsTillDate({
        startDate: deposit.startDate,
        totalInstallments: deposit.totalInstallments,
        installmentFrequency: deposit.installmentFrequency,
      });
      const totalInstallments = deposit.totalInstallments ?? 0;
      const timeProgressPercentage = totalInstallments > 0
        ? Number(((expectedInstallmentsTillDate / totalInstallments) * 100).toFixed(2))
        : 0;
      const nextInstallmentDate = getNextScheduledInstallmentDate({
        startDate: deposit.startDate,
        totalInstallments: deposit.totalInstallments,
        installmentFrequency: deposit.installmentFrequency,
      });

      // RD installments are auto-deducted by the bank (like loan EMIs),
      // so paid count equals expected installments by date.
      const paidInstallments = expectedInstallmentsTillDate;

      return {
        ...deposit,
        paidInstallments,
        nextInstallmentDate,
        expectedInstallmentsTillDate,
        timeProgressPercentage,
      };
    });

    return { success: true as const, data: enrichedDeposits };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch deposits",
    };
  }
}

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

export async function addDepositInstallment(data: {
  depositId: string;
  amount: number;
  dueDate: string | Date;
  paidDate?: string | Date;
  status?: "PENDING" | "PAID" | "MISSED";
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = depositInstallmentSchema.parse(data);

    const deposit = await prisma.depositInstrument.findFirst({
      where: {
        id: validated.depositId,
        userId: { in: await getUserIdsForCouple(user.id) },
      },
    });

    if (!deposit) {
      return { success: false as const, error: "Deposit not found" };
    }

    const installment = await prisma.$transaction(async (tx) => {
      const created = await tx.depositInstallment.create({
        data: {
          depositId: validated.depositId,
          amount: validated.amount,
          dueDate: validated.dueDate,
          paidDate: validated.paidDate,
          status: validated.status,
        },
      });

      if (deposit.type === "RECURRING_DEPOSIT" && validated.status === "PAID") {
        const nextInstallmentDate = getNextScheduledInstallmentDate({
          startDate: deposit.startDate,
          totalInstallments: deposit.totalInstallments,
          installmentFrequency: deposit.installmentFrequency,
        });

        await tx.depositInstrument.update({
          where: { id: deposit.id },
          data: {
            paidInstallments: { increment: 1 },
            nextInstallmentDate,
          },
        });
      } else if (deposit.type === "RECURRING_DEPOSIT") {
        const nextInstallmentDate = getNextScheduledInstallmentDate({
          startDate: deposit.startDate,
          totalInstallments: deposit.totalInstallments,
          installmentFrequency: deposit.installmentFrequency,
        });

        await tx.depositInstrument.update({
          where: { id: deposit.id },
          data: {
            nextInstallmentDate,
          },
        });
      }

      return created;
    });

    invalidateAfterDepositChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/deposits");
    return { success: true as const, data: installment };
  } catch (error) {
    return {
      success: false as const,
      ...formatActionError(error, "Failed to add installment"),
    };
  }
}

export async function getDepositsSummary() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const deposits = await prisma.depositInstrument.findMany({
      where: { userId: { in: coupleUserIds } },
      select: {
        id: true,
        status: true,
        principalAmount: true,
        maturityAmount: true,
        installmentAmount: true,
        nextInstallmentDate: true,
      },
    });

    const active = deposits.filter((d) => d.status === "ACTIVE");

    return {
      success: true as const,
      data: {
        count: deposits.length,
        activeCount: active.length,
        totalPrincipal: active.reduce((sum, d) => sum + d.principalAmount, 0),
        totalMaturity: active.reduce((sum, d) => sum + d.maturityAmount, 0),
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch deposit summary",
    };
  }
}

export async function migrateLegacyDepositAccounts() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const coupleId = await getCoupleIdForUser(user.id);

    const legacyAccounts = await prisma.financialAccount.findMany({
      where: {
        userId: { in: coupleUserIds },
        type: { in: ["RECURRING_DEPOSIT", "FIXED_DEPOSIT"] },
      },
    });

    let created = 0;

    for (const account of legacyAccounts) {
      const existing = await prisma.depositInstrument.findFirst({
        where: { sourceAccountId: account.id },
        select: { id: true },
      });

      if (existing) continue;

      const startDate = account.createdAt;
      const maturityDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      const rate = account.type === "FIXED_DEPOSIT" ? 6.5 : 7;
      const maturityAmount = Number((account.balance * (1 + rate / 100)).toFixed(2));

      await prisma.depositInstrument.create({
        data: {
          userId: account.userId,
          coupleId: account.coupleId ?? coupleId ?? undefined,
          name: account.name,
          provider: "",
          type:
            account.type === "FIXED_DEPOSIT"
              ? "FIXED_DEPOSIT"
              : "RECURRING_DEPOSIT",
          principalAmount: account.balance,
          interestRate: rate,
          tenureMonths: 12,
          installmentAmount: account.type === "RECURRING_DEPOSIT" ? Math.max(1, Math.round(account.balance / 12)) : null,
          installmentFrequency: "MONTHLY",
          paidInstallments: account.type === "RECURRING_DEPOSIT" ? 12 : 0,
          totalInstallments: account.type === "RECURRING_DEPOSIT" ? 12 : null,
          startDate,
          maturityDate,
          maturityAmount,
          status: maturityDate <= new Date() ? "MATURED" : "ACTIVE",
          sourceAccountId: account.id,
        },
      });

      created += 1;
    }

    if (created > 0) {
      invalidateAfterDepositChange();
      revalidatePath("/couple/finance");
      revalidatePath("/couple/finance/deposits");
    }

    return { success: true as const, data: { created, scanned: legacyAccounts.length } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to migrate legacy deposits",
    };
  }
}

export async function syncDepositReminders(userId: string) {
  noStore();
  const coupleUserIds = await getUserIdsForCouple(userId);
  const now = toStartOfDay(new Date());
  const sevenDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const [maturing, pendingRd] = await Promise.all([
    prisma.depositInstrument.findMany({
      where: {
        userId: { in: coupleUserIds },
        status: "ACTIVE",
        maturityDate: { lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7) },
      },
      select: { id: true },
    }),
    prisma.depositInstrument.findMany({
      where: {
        userId: { in: coupleUserIds },
        type: "RECURRING_DEPOSIT",
        status: "ACTIVE",
        nextInstallmentDate: { not: null, gte: now, lte: sevenDaysFromNow },
      },
      select: { id: true },
    }),
  ]);

  const month = monthKey(now);

  for (const deposit of maturing) {
    await createNotification(userId, "DEPOSIT_MATURITY_REMINDER", deposit.id);
  }

  for (const deposit of pendingRd) {
    await createNotification(userId, "DEPOSIT_INSTALLMENT_REMINDER", `${deposit.id}:${month}`);
  }

  return { created: maturing.length + pendingRd.length };
}
