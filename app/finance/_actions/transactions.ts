"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { transactionSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function getTransactions(params?: {
  month?: string;
  category?: string;
  accountId?: string;
  limit?: number;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const where: { userId: string | { in: string[] }; date?: { gte: Date; lt: Date }; category?: string; accountId?: string } = { userId: user.id };

    // Expand to couple scope
    const coupleUserIds = await getUserIdsForCouple(user.id);
    (where as Record<string, unknown>).userId = { in: coupleUserIds };

    if (params?.month) {
      const [year, month] = params.month.split("-").map(Number);
      where.date = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.accountId) {
      where.accountId = params.accountId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: params?.limit,
      include: { account: { select: { name: true } } },
    });

    return { success: true as const, data: transactions };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transactions",
    };
  }
}

export async function getTransaction(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: { in: coupleUserIds } },
      include: { account: { select: { name: true } } },
    });

    if (!transaction) {
      return { success: false as const, error: "Transaction not found" };
    }

    return { success: true as const, data: transaction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transaction",
    };
  }
}

export async function createTransaction(data: {
  accountId: string;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string | Date;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = transactionSchema.parse(data);

    // Verify account ownership (couple-wide)
    const coupleUserIds = await getUserIdsForCouple(user.id);
    const account = await prisma.financialAccount.findFirst({
      where: { id: validated.accountId, userId: { in: coupleUserIds } },
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    const balanceAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const coupleId = await getCoupleIdForUser(user.id);

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description,
          date: validated.date,
          ...(coupleId ? { coupleId } : {}),
        },
      }),
      prisma.financialAccount.update({
        where: { id: validated.accountId },
        data: { balance: { increment: balanceAdjustment } },
      }),
    ]);

    return { success: true as const, data: transaction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

export async function updateTransaction(
  id: string,
  data: {
    accountId?: string;
    amount?: number;
    type?: string;
    category?: string;
    description?: string;
    date?: string | Date;
  },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Transaction not found" };
    }

    const merged = {
      accountId: data.accountId ?? existing.accountId,
      amount: data.amount ?? existing.amount,
      type: data.type ?? existing.type,
      category: data.category ?? existing.category,
      description: data.description ?? existing.description,
      date: data.date ?? existing.date,
    };

    const validated = transactionSchema.parse(merged);

    // If account changed, verify ownership of new account (couple-wide)
    if (validated.accountId !== existing.accountId) {
      const coupleUserIds = await getUserIdsForCouple(user.id);
      const newAccount = await prisma.financialAccount.findFirst({
        where: { id: validated.accountId, userId: { in: coupleUserIds } },
      });
      if (!newAccount) {
        return { success: false as const, error: "Account not found" };
      }
    }

    // Reverse old balance impact
    const oldReversal =
      existing.type === "INCOME" ? -existing.amount : existing.amount;

    // Apply new balance impact
    const newAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const transaction = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description,
          date: validated.date,
        },
      });

      if (validated.accountId === existing.accountId) {
        await tx.financialAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: oldReversal + newAdjustment } },
        });
      } else {
        await tx.financialAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: oldReversal } },
        });
        await tx.financialAccount.update({
          where: { id: validated.accountId },
          data: { balance: { increment: newAdjustment } },
        });
      }

      return updated;
    });

    return { success: true as const, data: transaction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update transaction",
    };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Transaction not found" };
    }

    // Reverse the balance impact
    const reversal =
      existing.type === "INCOME" ? -existing.amount : existing.amount;

    await prisma.$transaction([
      prisma.transaction.delete({ where: { id } }),
      prisma.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: reversal } },
      }),
    ]);

    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}

export async function getTransactionsByMonth(month: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const [year, m] = month.split("-").map(Number);
    const coupleUserIds = await getUserIdsForCouple(user.id);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: { in: coupleUserIds },
        date: {
          gte: new Date(year, m - 1, 1),
          lt: new Date(year, m, 1),
        },
      },
      orderBy: { date: "desc" },
      include: { account: { select: { name: true } } },
    });

    return { success: true as const, data: transactions };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transactions",
    };
  }
}

export async function getCategoryAggregation(month?: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const now = new Date();
    const targetMonth =
      month ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [year, m] = targetMonth.split("-").map(Number);
    const coupleUserIds = await getUserIdsForCouple(user.id);

    const aggregation = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE",
        date: {
          gte: new Date(year, m - 1, 1),
          lt: new Date(year, m, 1),
        },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const data = aggregation.map((item: { category: string; _sum: { amount: number | null } }) => ({
      category: item.category,
      total: item._sum.amount ?? 0,
    }));

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to aggregate categories",
    };
  }
}
