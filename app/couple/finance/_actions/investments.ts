"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { investmentHoldings } from "@db/schema";
import { eq, and, inArray, desc, lte, isNotNull } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { investmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { createNotification } from "@/_services/finance/notification-service";
import { invalidateAfterInvestmentChange } from "@/_lib/cache";
import { formatActionError } from "./_shared";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getInvestments() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const investments = await db.query.investmentHoldings.findMany({
      where: inArray(investmentHoldings.userId, coupleUserIds),
      orderBy: [desc(investmentHoldings.createdAt)],
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

    const [holding] = await db
      .insert(investmentHoldings)
      .values({
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
      })
      .returning();

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

    const existing = await db.query.investmentHoldings.findFirst({
      where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, await getUserIdsForCouple(user.id))),
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

    const [updated] = await db
      .update(investmentHoldings)
      .set({
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
      })
      .where(eq(investmentHoldings.id, id))
      .returning();

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

    const existingToDelete = await db.query.investmentHoldings.findFirst({
      where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, await getUserIdsForCouple(user.id))),
    });

    if (!existingToDelete) {
      return { success: false as const, error: "Investment not found" };
    }

    await db.delete(investmentHoldings).where(eq(investmentHoldings.id, id));

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

    const holdingRows = await db.query.investmentHoldings.findMany({
      where: inArray(investmentHoldings.userId, coupleUserIds),
      columns: {
        id: true,
        investedAmount: true,
        currentValue: true,
      },
    });

    const invested = holdingRows.reduce((sum, h) => sum + h.investedAmount, 0);
    const current = holdingRows.reduce(
      (sum, h) => sum + (h.currentValue ?? h.investedAmount),
      0,
    );

    return {
      success: true as const,
      data: {
        count: holdingRows.length,
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

  const sipHoldings = await db.query.investmentHoldings.findMany({
    where: and(
      inArray(investmentHoldings.userId, coupleUserIds),
      eq(investmentHoldings.mode, "SIP"),
      isNotNull(investmentHoldings.nextSipDate),
      lte(investmentHoldings.nextSipDate, today),
    ),
    columns: { id: true },
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
