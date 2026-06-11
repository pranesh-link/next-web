"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { financialAccounts, balanceHistory } from "@db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { accountSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { recordBalanceChange } from "@/_services/finance/balance-history-service";
import { invalidateAfterAccountChange } from "@/_lib/cache";
import { logOverallBalanceChange } from "./accounts-helpers";

/**
 * Create a new financial account for the couple. When `isSalaryAccount` is true, any other salary-tagged account is unset atomically; emergency-fund accounts are capped at 2 per couple.
 *
 * @param formData - Either a {@link FormData} payload or a typed object with the account fields.
 * @returns The created account on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function createAccount(
  formData:
    | FormData
    | {
        name: string;
        nickname?: string;
        type: string;
        balance: number;
        isSalaryAccount?: boolean;
        isEmergencyFund?: boolean;
        ownerId?: string;
      },
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const raw =
      formData instanceof FormData
        ? {
            name: formData.get("name") as string,
            nickname: (formData.get("nickname") as string) || undefined,
            type: formData.get("type") as string,
            balance: Number(formData.get("balance")),
          }
        : formData;

    const isSalaryAccount =
      formData instanceof FormData
        ? formData.get("isSalaryAccount") === "true"
        : formData.isSalaryAccount === true;

    const isEmergencyFund =
      formData instanceof FormData
        ? formData.get("isEmergencyFund") === "true"
        : (formData as { isEmergencyFund?: boolean }).isEmergencyFund === true;

    const ownerId =
      formData instanceof FormData
        ? (formData.get("ownerId") as string) || user.id
        : (formData as { ownerId?: string }).ownerId || user.id;

    const validated = accountSchema.parse(raw);

    const coupleId = await getCoupleIdForUser(user.id);
    const coupleUserIds = await getUserIdsForCouple(user.id);

    if (!coupleUserIds.includes(ownerId)) {
      return { success: false as const, error: "Owner must be a couple member" };
    }

    if (isEmergencyFund) {
      const [{ n }] = await db
        .select({ n: count() })
        .from(financialAccounts)
        .where(and(inArray(financialAccounts.userId, coupleUserIds), eq(financialAccounts.isEmergencyFund, true)));
      if (n >= 2) {
        return {
          success: false as const,
          error: "Maximum 2 emergency fund accounts allowed per couple",
        };
      }
    }

    const account = await db.transaction(async (tx) => {
      if (isSalaryAccount) {
        await tx
          .update(financialAccounts)
          .set({ isSalaryAccount: false })
          .where(and(inArray(financialAccounts.userId, coupleUserIds), eq(financialAccounts.isSalaryAccount, true)));
      }

      const [created] = await tx
        .insert(financialAccounts)
        .values({
          userId: ownerId,
          name: validated.name,
          nickname: validated.nickname || null,
          type: validated.type,
          balance: validated.balance,
          isSalaryAccount,
          isEmergencyFund,
          ...(coupleId ? { coupleId } : {}),
        })
        .returning();
      return created;
    });

    if (validated.balance !== 0) {
      await recordBalanceChange(
        account.id, 0, validated.balance, ownerId, coupleId, "Opening balance",
      );
    }

    await logOverallBalanceChange(
      coupleUserIds, ownerId, coupleId, account.id,
      validated.name, "ACCOUNT_ADDED", validated.balance,
    );

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create account",
    };
  }
}

/**
 * Update an existing account's editable fields (name, nickname, type, balance). Partial updates are merged against the existing record before validation.
 *
 * @param id - The account id.
 * @param data - Partial set of fields to update.
 * @returns The updated account on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function updateAccount(
  id: string,
  data: { name?: string; nickname?: string; type?: string; balance?: number },
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      nickname: data.nickname !== undefined ? data.nickname : existing.nickname,
      type: data.type ?? existing.type,
      balance: data.balance ?? existing.balance,
    };

    const validated = accountSchema.parse(merged);

    const [account] = await db
      .update(financialAccounts)
      .set({
        name: validated.name,
        nickname: validated.nickname || null,
        type: validated.type,
        balance: validated.balance,
      })
      .where(eq(financialAccounts.id, id))
      .returning();

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update account",
    };
  }
}

/**
 * Permanently delete an account and append an audit log entry for the removal.
 *
 * @param id - The account id.
 * @returns Result containing `{ id }` on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function deleteAccount(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existingAcct = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existingAcct) {
      return { success: false as const, error: "Account not found" };
    }

    const deletedName = existingAcct.name;
    const deletedBalance = existingAcct.balance;

    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));

    const coupleId = await getCoupleIdForUser(user.id);
    await logOverallBalanceChange(
      coupleUserIds, user.id, coupleId, null,
      deletedName, "ACCOUNT_REMOVED", -deletedBalance,
    );

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

/**
 * Set a new balance on the account, recording a per-account history entry and a couple-wide log entry.
 *
 * @param id - The account id.
 * @param newBalance - The new absolute balance to write.
 * @param note - Optional free-text note attached to the history entry.
 * @returns The updated account on success; an error result on failure (including when balance is unchanged).
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/accounts`.
 */
export async function updateAccountBalance(
  id: string,
  newBalance: number,
  note?: string,
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existingBal = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!existingBal) {
      return { success: false as const, error: "Account not found" };
    }

    if (existingBal.balance === newBalance) {
      return { success: false as const, error: "Balance is the same" };
    }

    const coupleId = await getCoupleIdForUser(user.id);

    const [account] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(financialAccounts)
        .set({ balance: newBalance })
        .where(eq(financialAccounts.id, id))
        .returning();

      await tx.insert(balanceHistory).values({
        accountId: id,
        balance: newBalance,
        change: newBalance - existingBal.balance,
        note: note || null,
        userId: user.id,
        coupleId: coupleId || null,
      });

      return [updated];
    });

    await logOverallBalanceChange(
      coupleUserIds, user.id, coupleId, id,
      existingBal.name, "BALANCE_UPDATED", newBalance - existingBal.balance,
    );

    invalidateAfterAccountChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/accounts");
    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update balance",
    };
  }
}
