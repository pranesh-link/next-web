"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { depositSchema, depositInstallmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { createNotification } from "@/_services/finance/notification-service";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export async function getDeposits() {
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

    await syncDepositReminders(user.id);

    return { success: true as const, data: deposits };
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
  paidInstallments?: number;
  totalInstallments?: number;
  startDate: string | Date;
  maturityDate: string | Date;
  maturityAmount: number;
  nextInstallmentDate?: string | Date;
  sourceAccountId?: string;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = depositSchema.parse(data);
    const coupleId = await getCoupleIdForUser(user.id);

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
        paidInstallments: validated.paidInstallments,
        totalInstallments: validated.totalInstallments,
        startDate: validated.startDate,
        maturityDate: validated.maturityDate,
        maturityAmount: validated.maturityAmount,
        nextInstallmentDate: validated.nextInstallmentDate,
        sourceAccountId: validated.sourceAccountId,
        ...(coupleId ? { coupleId } : {}),
      },
    });

    return { success: true as const, data: deposit };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create deposit",
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
    paidInstallments?: number;
    totalInstallments?: number;
    startDate?: string | Date;
    maturityDate?: string | Date;
    maturityAmount?: number;
    nextInstallmentDate?: string | Date;
  },
) {
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
      paidInstallments: data.paidInstallments ?? existing.paidInstallments,
      totalInstallments: data.totalInstallments ?? (existing.totalInstallments ?? undefined),
      startDate: data.startDate ?? existing.startDate,
      maturityDate: data.maturityDate ?? existing.maturityDate,
      maturityAmount: data.maturityAmount ?? existing.maturityAmount,
      nextInstallmentDate: data.nextInstallmentDate ?? (existing.nextInstallmentDate ?? undefined),
      sourceAccountId: existing.sourceAccountId ?? undefined,
    };

    const validated = depositSchema.parse(merged);

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
        paidInstallments: validated.paidInstallments,
        totalInstallments: validated.totalInstallments,
        startDate: validated.startDate,
        maturityDate: validated.maturityDate,
        maturityAmount: validated.maturityAmount,
        nextInstallmentDate: validated.nextInstallmentDate,
        status,
      },
    });

    return { success: true as const, data: updated };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update deposit",
    };
  }
}

export async function deleteDeposit(id: string) {
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
        await tx.depositInstrument.update({
          where: { id: deposit.id },
          data: {
            paidInstallments: { increment: 1 },
            nextInstallmentDate: deposit.nextInstallmentDate
              ? new Date(
                  deposit.nextInstallmentDate.getFullYear(),
                  deposit.nextInstallmentDate.getMonth() + 1,
                  deposit.nextInstallmentDate.getDate(),
                )
              : undefined,
          },
        });
      }

      return created;
    });

    return { success: true as const, data: installment };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to add installment",
    };
  }
}

export async function getDepositsSummary() {
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

    return { success: true as const, data: { created, scanned: legacyAccounts.length } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to migrate legacy deposits",
    };
  }
}

export async function syncDepositReminders(userId: string) {
  const coupleUserIds = await getUserIdsForCouple(userId);
  const now = new Date();

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
        nextInstallmentDate: { not: null, lte: now },
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
