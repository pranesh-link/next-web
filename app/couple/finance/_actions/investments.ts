"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { investmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { createNotification } from "@/_services/finance/notification-service";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getInvestments() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const investments = await prisma.investmentHolding.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { createdAt: "desc" },
    });

    await syncInvestmentReminders(user.id);

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

    return { success: true as const, data: holding };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create investment",
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

    return { success: true as const, data: updated };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update investment",
    };
  }
}

export async function deleteInvestment(id: string) {
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

    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete investment",
    };
  }
}

export async function getInvestmentsSummary() {
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
