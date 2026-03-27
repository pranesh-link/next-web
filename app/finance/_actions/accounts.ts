"use server";

import prisma from "@/_lib/prisma";
import { AccountType } from "@prisma/client";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { accountSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { recordBalanceChange, getHistoryForAccount } from "@/_services/finance/balance-history-service";

export async function getAccounts() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const accounts = await prisma.financialAccount.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true as const, data: accounts };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch accounts",
    };
  }
}

export async function getAccount(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const account = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch account",
    };
  }
}

export async function createAccount(
  formData: FormData | { name: string; type: string; balance: number; isSalaryAccount?: boolean },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const raw =
      formData instanceof FormData
        ? {
            name: formData.get("name") as string,
            type: formData.get("type") as string,
            balance: Number(formData.get("balance")),
          }
        : formData;

    const isSalaryAccount =
      formData instanceof FormData
        ? formData.get("isSalaryAccount") === "true"
        : formData.isSalaryAccount === true;

    const validated = accountSchema.parse(raw);

    const coupleId = await getCoupleIdForUser(user.id);
    const coupleUserIds = await getUserIdsForCouple(user.id);

    const account = await prisma.$transaction(async (tx) => {
      if (isSalaryAccount) {
        await tx.financialAccount.updateMany({
          where: { userId: { in: coupleUserIds }, isSalaryAccount: true },
          data: { isSalaryAccount: false },
        });
      }

      return tx.financialAccount.create({
        data: {
          userId: user.id,
          name: validated.name,
          type: validated.type as AccountType,
          balance: validated.balance,
          isSalaryAccount,
          ...(coupleId ? { coupleId } : {}),
        },
      });
    });

    if (validated.balance !== 0) {
      await recordBalanceChange(
        account.id, 0, validated.balance, user.id, coupleId, "Opening balance",
      );
    }

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create account",
    };
  }
}

export async function updateAccount(
  id: string,
  data: { name?: string; type?: string; balance?: number },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      type: data.type ?? existing.type,
      balance: data.balance ?? existing.balance,
    };

    const validated = accountSchema.parse(merged);

    const account = await prisma.financialAccount.update({
      where: { id },
      data: {
        name: validated.name,
        type: validated.type as AccountType,
        balance: validated.balance,
      },
    });

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update account",
    };
  }
}

export async function deleteAccount(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    await prisma.financialAccount.delete({ where: { id } });

    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

export async function getTotalBalance() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const result = await prisma.financialAccount.aggregate({
      where: { userId: { in: coupleUserIds } },
      _sum: { balance: true },
    });

    return { success: true as const, data: result._sum.balance ?? 0 };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to calculate total balance",
    };
  }
}

export async function updateAccountBalance(
  id: string,
  newBalance: number,
  note?: string,
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Account not found" };
    }

    if (existing.balance === newBalance) {
      return { success: false as const, error: "Balance is the same" };
    }

    const coupleId = await getCoupleIdForUser(user.id);

    const [account] = await prisma.$transaction([
      prisma.financialAccount.update({
        where: { id },
        data: { balance: newBalance },
      }),
      prisma.balanceHistory.create({
        data: {
          accountId: id,
          balance: newBalance,
          change: newBalance - existing.balance,
          note: note || null,
          userId: user.id,
          coupleId: coupleId || null,
        },
      }),
    ]);

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update balance",
    };
  }
}

export async function getAccountBalanceHistory(accountId: string, cursor?: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const account = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: { in: coupleUserIds } },
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    const { items, nextCursor } = await getHistoryForAccount(accountId, coupleUserIds, 20, cursor);
    return { success: true as const, data: { items, nextCursor } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch balance history",
    };
  }
}

export async function setSalaryAccount(accountId: string) {
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

    return { success: true as const, data: updatedAccount };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to set salary account",
    };
  }
}
