"use server";

import prisma from "@/_lib/prisma";
import { AccountType } from "@prisma/client";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { accountSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { recordBalanceChange, getHistoryForAccount } from "@/_services/finance/balance-history-service";
import { getCoupleMembers } from "@/_services/finance/couple-service";

export async function getAccounts() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const accounts = await prisma.financialAccount.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { id: true, name: true } } },
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
      include: { user: { select: { id: true, name: true } } },
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
  formData: FormData | { name: string; type: string; balance: number; isSalaryAccount?: boolean; isEmergencyFund?: boolean; ownerId?: string },
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

    // Validate ownerId is a couple member
    if (!coupleUserIds.includes(ownerId)) {
      return { success: false as const, error: "Owner must be a couple member" };
    }

    // Check emergency fund limit (max 2 per couple)
    if (isEmergencyFund) {
      const efCount = await prisma.financialAccount.count({
        where: { userId: { in: coupleUserIds }, isEmergencyFund: true },
      });
      if (efCount >= 2) {
        return { success: false as const, error: "Maximum 2 emergency fund accounts allowed per couple" };
      }
    }

    const account = await prisma.$transaction(async (tx) => {
      if (isSalaryAccount) {
        await tx.financialAccount.updateMany({
          where: { userId: { in: coupleUserIds }, isSalaryAccount: true },
          data: { isSalaryAccount: false },
        });
      }

      return tx.financialAccount.create({
        data: {
          userId: ownerId,
          name: validated.name,
          type: validated.type as AccountType,
          balance: validated.balance,
          isSalaryAccount,
          isEmergencyFund,
          ...(coupleId ? { coupleId } : {}),
        },
      });
    });

    if (validated.balance !== 0) {
      await recordBalanceChange(
        account.id, 0, validated.balance, ownerId, coupleId, "Opening balance",
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

export async function togglePinAccount(accountId: string) {
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

    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data: { isPinned: !existing.isPinned },
    });

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to toggle pin",
    };
  }
}

export async function setEmergencyFundAccount(accountId: string) {
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

    if (existing.isEmergencyFund) {
      return { success: false as const, error: "Already tagged as emergency fund" };
    }

    const efCount = await prisma.financialAccount.count({
      where: { userId: { in: coupleUserIds }, isEmergencyFund: true },
    });
    if (efCount >= 2) {
      return { success: false as const, error: "Maximum 2 emergency fund accounts allowed" };
    }

    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data: { isEmergencyFund: true },
    });

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to set emergency fund",
    };
  }
}

export async function unsetEmergencyFundAccount(accountId: string) {
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

    const account = await prisma.financialAccount.update({
      where: { id: accountId },
      data: { isEmergencyFund: false },
    });

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to unset emergency fund",
    };
  }
}

export async function getCoupleUsers() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getCoupleIdForUser(user.id);

    if (!coupleId) {
      // Solo user — return just themselves
      const self = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true },
      });
      return { success: true as const, data: self ? [self] : [], currentUserId: user.id };
    }

    const members = await getCoupleMembers(coupleId);
    const users = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    }));

    return { success: true as const, data: users, currentUserId: user.id };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch couple users",
    };
  }
}

export async function getAccountActivity(accountId: string, cursor?: string) {
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

    const pageSize = 20;
    let cursorDate: Date | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const [dateStr, id] = cursor.split("|");
      cursorDate = new Date(dateStr);
      cursorId = id;
    }

    // Fetch both in parallel
    const [balanceHistory, transactions] = await Promise.all([
      prisma.balanceHistory.findMany({
        where: { accountId, userId: { in: coupleUserIds } },
        orderBy: { createdAt: "desc" },
        take: pageSize + 1,
        ...(cursorDate ? { where: { accountId, userId: { in: coupleUserIds }, createdAt: { lte: cursorDate } } } : {}),
      }),
      prisma.transaction.findMany({
        where: { accountId, userId: { in: coupleUserIds } },
        orderBy: { date: "desc" },
        take: pageSize + 1,
        ...(cursorDate ? { where: { accountId, userId: { in: coupleUserIds }, date: { lte: cursorDate } } } : {}),
      }),
    ]);

    // Normalize to unified items
    type ActivityItem = {
      id: string;
      date: Date;
      source: "balance" | "transaction";
      amount: number;
      change: number;
      balance: number;
      note: string | null;
      description: string | null;
      category: string | null;
      type: string | null;
    };

    const items: ActivityItem[] = [
      ...balanceHistory.map((h) => ({
        id: h.id,
        date: h.createdAt,
        source: "balance" as const,
        amount: Math.abs(h.change),
        change: h.change,
        balance: h.balance,
        note: h.note,
        description: null,
        category: null,
        type: null,
      })),
      ...transactions.map((t) => ({
        id: t.id,
        date: t.date,
        source: "transaction" as const,
        amount: t.amount,
        change: t.type === "INCOME" ? t.amount : -t.amount,
        balance: 0, // Not tracked per-transaction
        note: null,
        description: t.description,
        category: t.category,
        type: t.type,
      })),
    ];

    // Sort by date DESC, then by id for stable ordering
    items.sort((a, b) => {
      const diff = b.date.getTime() - a.date.getTime();
      if (diff !== 0) return diff;
      return b.id.localeCompare(a.id);
    });

    // Remove items before cursor
    let filtered = items;
    if (cursorDate && cursorId) {
      const cursorTime = cursorDate.getTime();
      const idx = filtered.findIndex(
        (item) => item.date.getTime() === cursorTime && item.id === cursorId
      );
      if (idx !== -1) {
        filtered = filtered.slice(idx + 1);
      } else {
        filtered = filtered.filter(
          (item) => item.date.getTime() < cursorTime
        );
      }
    }

    const page = filtered.slice(0, pageSize);
    const hasMore = filtered.length > pageSize;
    const lastItem = page[page.length - 1];
    const nextCursor = hasMore && lastItem
      ? `${lastItem.date.toISOString()}|${lastItem.id}`
      : null;

    return { success: true as const, data: { items: page, nextCursor } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch account activity",
    };
  }
}
