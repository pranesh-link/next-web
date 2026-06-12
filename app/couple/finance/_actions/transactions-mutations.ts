"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { transactions, financialAccounts } from "@db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
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
    const account = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, validated.accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    const balanceAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const coupleId = await getCoupleIdForUser(user.id);

    const transaction = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          userId: user.id,
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description,
          date: validated.date,
          ...(coupleId ? { coupleId } : {}),
        })
        .returning();

      await tx
        .update(financialAccounts)
        .set({ balance: sql`${financialAccounts.balance} + ${balanceAdjustment}` })
        .where(eq(financialAccounts.id, validated.accountId));

      return created;
    });

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

    const existing = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), inArray(transactions.userId, await getUserIdsForCouple(user.id))),
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
      const newAccount = await db.query.financialAccounts.findFirst({
        where: and(eq(financialAccounts.id, validated.accountId), inArray(financialAccounts.userId, coupleUserIds)),
      });
      if (!newAccount) {
        return { success: false as const, error: "Account not found" };
      }
    }

    const oldReversal = existing.type === "INCOME" ? -existing.amount : existing.amount;
    const newAdjustment = validated.type === "INCOME" ? validated.amount : -validated.amount;

    const transaction = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(transactions)
        .set({
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description,
          date: validated.date,
        })
        .where(eq(transactions.id, id))
        .returning();

      if (validated.accountId === existing.accountId) {
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${oldReversal + newAdjustment}` })
          .where(eq(financialAccounts.id, existing.accountId));
      } else {
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${oldReversal}` })
          .where(eq(financialAccounts.id, existing.accountId));
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${newAdjustment}` })
          .where(eq(financialAccounts.id, validated.accountId));
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

    const existingToDelete = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), inArray(transactions.userId, await getUserIdsForCouple(user.id))),
    });

    if (!existingToDelete) {
      return { success: false as const, error: "Transaction not found" };
    }

    const reversal = existingToDelete.type === "INCOME" ? -existingToDelete.amount : existingToDelete.amount;

    await db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.id, id));
      await tx
        .update(financialAccounts)
        .set({ balance: sql`${financialAccounts.balance} + ${reversal}` })
        .where(eq(financialAccounts.id, existingToDelete.accountId));
    });

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
