"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { investmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { createNotification } from "@/_services/finance/notification-service";
import { ZodError } from "zod";
import { invalidateAfterInvestmentChange } from "@/_lib/cache";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

export async function getInvestments() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const investments = await prisma.investmentHolding.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true as const, data: investments };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch investments",
    };
  }
}

export async function createInvestment(data: {
  name: string;
  assetType: "GOLD" | "SILVER" | "STOCK" | "MUTUAL_FUND";
  mode?: "LUMPSUM" | "SIP";
  ticker?: string;
  exchange?: "NSE" | "BSE";
  quantity?: number;
  quantityGrams?: number;
  investedAmount: number;
  currentPrice?: number;
  currentValue?: number;
  sipAmount?: number;
  sipDayOfMonth?: number;
  startDate: string | Date;
  nextSipDate?: string | Date;
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = investmentSchema.parse(data);
    const coupleId = await getCoupleIdForUser(user.id);

    const holding = await prisma.investmentHolding.create({
      data: {
        userId: user.id,
        name: validated.name,
        assetType: validated.assetType,
        mode: validated.mode,
        ticker: validated.ticker,
        exchange: validated.exchange,
        quantity: validated.quantity,
        quantityGrams: validated.quantityGrams,
        investedAmount: validated.investedAmount,
        currentPrice: validated.currentPrice,
        currentValue: validated.currentValue,
        sipAmount: validated.sipAmount,
        sipDayOfMonth: validated.sipDayOfMonth,
        startDate: validated.startDate,
        nextSipDate: validated.nextSipDate,
        ...(coupleId ? { coupleId } : {}),
      },
    });

    invalidateAfterInvestmentChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/investments");
    return { success: true as const, data: holding };
  } catch (error) {
    return {
      success: false as const,
      ...formatActionError(error, "Failed to create investment"),
    };
  }
}

export async function updateInvestment(
  id: string,
  data: {
    name?: string;
    assetType?: "GOLD" | "SILVER" | "STOCK" | "MUTUAL_FUND";
    mode?: "LUMPSUM" | "SIP";
    ticker?: string;
    exchange?: "NSE" | "BSE";
    quantity?: number;
    quantityGrams?: number;
    investedAmount?: number;
    currentPrice?: number;
    currentValue?: number;
    sipAmount?: number;
    sipDayOfMonth?: number;
    startDate?: string | Date;
    nextSipDate?: string | Date;
  },
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.investmentHolding.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Investment not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      assetType: data.assetType ?? existing.assetType,
      mode: data.mode ?? existing.mode,
      ticker: data.ticker ?? (existing.ticker ?? undefined),
      exchange: data.exchange ?? (existing.exchange ?? undefined),
      quantity: data.quantity ?? (existing.quantity ?? undefined),
      quantityGrams: data.quantityGrams ?? (existing.quantityGrams ?? undefined),
      investedAmount: data.investedAmount ?? existing.investedAmount,
      currentPrice: data.currentPrice ?? (existing.currentPrice ?? undefined),
      currentValue: data.currentValue ?? (existing.currentValue ?? undefined),
      sipAmount: data.sipAmount ?? (existing.sipAmount ?? undefined),
      sipDayOfMonth: data.sipDayOfMonth ?? (existing.sipDayOfMonth ?? undefined),
      startDate: data.startDate ?? existing.startDate,
      nextSipDate: data.nextSipDate ?? (existing.nextSipDate ?? undefined),
    };

    const validated = investmentSchema.parse(merged);

    const updated = await prisma.investmentHolding.update({
      where: { id },
      data: {
        name: validated.name,
        assetType: validated.assetType,
        mode: validated.mode,
        ticker: validated.ticker,
        exchange: validated.exchange,
        quantity: validated.quantity,
        quantityGrams: validated.quantityGrams,
        investedAmount: validated.investedAmount,
        currentPrice: validated.currentPrice,
        currentValue: validated.currentValue,
        sipAmount: validated.sipAmount,
        sipDayOfMonth: validated.sipDayOfMonth,
        startDate: validated.startDate,
        nextSipDate: validated.nextSipDate,
      },
    });

    invalidateAfterInvestmentChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/investments");
    return { success: true as const, data: updated };
  } catch (error) {
    return {
      success: false as const,
      ...formatActionError(error, "Failed to update investment"),
    };
  }
}

export async function deleteInvestment(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.investmentHolding.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Investment not found" };
    }

    await prisma.investmentHolding.delete({ where: { id } });

    invalidateAfterInvestmentChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/investments");
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete investment",
    };
  }
}

export async function getInvestmentsSummary() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const holdings = await prisma.investmentHolding.findMany({
      where: { userId: { in: coupleUserIds } },
      select: {
        id: true,
        investedAmount: true,
        currentValue: true,
      },
    });

    const invested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
    const current = holdings.reduce(
      (sum, h) => sum + (h.currentValue ?? h.investedAmount),
      0,
    );

    return {
      success: true as const,
      data: {
        count: holdings.length,
        totalInvested: invested,
        currentValue: current,
        gainLoss: current - invested,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to fetch investments summary",
    };
  }
}

export async function syncInvestmentReminders(userId: string) {
  noStore();
  const coupleUserIds = await getUserIdsForCouple(userId);
  const today = new Date();

  const sipHoldings = await prisma.investmentHolding.findMany({
    where: {
      userId: { in: coupleUserIds },
      mode: "SIP",
      nextSipDate: { not: null, lte: today },
    },
    select: { id: true },
  });

  if (sipHoldings.length === 0) {
    return { created: 0 };
  }

  const month = monthKey(today);

  for (const holding of sipHoldings) {
    await createNotification(userId, "INVESTMENT_SIP_REMINDER", `${holding.id}:${month}`);
  }

  return { created: sipHoldings.length };
}
