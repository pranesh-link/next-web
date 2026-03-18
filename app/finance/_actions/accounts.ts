"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { accountSchema } from "@/_lib/validations/finance";

export async function getAccounts() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const accounts = await prisma.financialAccount.findMany({
      where: { userId: user.id },
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

    const account = await prisma.financialAccount.findFirst({
      where: { id, userId: user.id },
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
  formData: FormData | { name: string; type: string; balance: number },
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

    const validated = accountSchema.parse(raw);

    const account = await prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: validated.name,
        type: validated.type,
        balance: validated.balance,
      },
    });

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

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: user.id },
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
        type: validated.type,
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

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: user.id },
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

    const result = await prisma.financialAccount.aggregate({
      where: { userId: user.id },
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
