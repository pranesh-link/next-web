"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { transactionSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { invalidateAfterTransactionChange } from "@/_lib/cache";

/**
 * Create a transaction and atomically adjust the parent account's balance (income increments, expense decrements).
 *
 * @param data - Transaction payload (account, amount, type, category, optional description, date).
 * @returns The created transaction on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/transactions`, and `/couple/finance/budget-planner`.
 */
export async function createTransaction(data: {
  accountId: string;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string | Date;
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = transactionSchema.parse(data);

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

    invalidateAfterTransactionChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/transactions");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: transaction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

/**
 * Update a transaction. Reverses the previous balance impact and applies the new one, supporting account changes.
 *
 * @param id - Transaction id.
 * @param data - Partial set of fields to update.
 * @returns The updated transaction on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/transactions`, and `/couple/finance/budget-planner`.
 */
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
  noStore();
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

    if (validated.accountId !== existing.accountId) {
      const coupleUserIds = await getUserIdsForCouple(user.id);
      const newAccount = await prisma.financialAccount.findFirst({
        where: { id: validated.accountId, userId: { in: coupleUserIds } },
      });
      if (!newAccount) {
        return { success: false as const, error: "Account not found" };
      }
    }

    const oldReversal = existing.type === "INCOME" ? -existing.amount : existing.amount;
    const newAdjustment = validated.type === "INCOME" ? validated.amount : -validated.amount;

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    invalidateAfterTransactionChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/transactions");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: transaction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update transaction",
    };
  }
}

/**
 * Delete a transaction and atomically reverse its balance impact on the parent account.
 *
 * @param id - Transaction id.
 * @returns Result with `{ id }` on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance`, `/couple/finance/transactions`, and `/couple/finance/budget-planner`.
 */
export async function deleteTransaction(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Transaction not found" };
    }

    const reversal = existing.type === "INCOME" ? -existing.amount : existing.amount;

    await prisma.$transaction([
      prisma.transaction.delete({ where: { id } }),
      prisma.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: reversal } },
      }),
    ]);

    invalidateAfterTransactionChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/transactions");
    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}
