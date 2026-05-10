"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { invalidateAfterDepositChange } from "@/_lib/cache";

/**
 * Create deposit instruments for legacy `RECURRING_DEPOSIT` / `FIXED_DEPOSIT` financial accounts that don't yet have one.
 *
 * Each generated deposit is linked back to the source account via `sourceAccountId`,
 * so subsequent runs are idempotent.
 *
 * @returns Result with `{ created, scanned }` counts on success; an error result on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/deposits` only when at least one deposit was created.
 */
export async function migrateLegacyDepositAccounts() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const coupleId = await getCoupleIdForUser(user.id);

    const legacyAccounts = await prisma.financialAccount.findMany({
      where: {
        userId: { in: coupleUserIds },
        type: { in: ["RECURRING_DEPOSIT", "FIXED_DEPOSIT"] },
      },
    });

    let created = 0;

    for (const account of legacyAccounts) {
      const existing = await prisma.depositInstrument.findFirst({
        where: { sourceAccountId: account.id },
        select: { id: true },
      });

      if (existing) continue;

      const startDate = account.createdAt;
      const maturityDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      const rate = account.type === "FIXED_DEPOSIT" ? 6.5 : 7;
      const maturityAmount = Number((account.balance * (1 + rate / 100)).toFixed(2));

      await prisma.depositInstrument.create({
        data: {
          userId: account.userId,
          coupleId: account.coupleId ?? coupleId ?? undefined,
          name: account.name,
          provider: "",
          type:
            account.type === "FIXED_DEPOSIT"
              ? "FIXED_DEPOSIT"
              : "RECURRING_DEPOSIT",
          principalAmount: account.balance,
          interestRate: rate,
          tenureMonths: 12,
          installmentAmount: account.type === "RECURRING_DEPOSIT" ? Math.max(1, Math.round(account.balance / 12)) : null,
          installmentFrequency: "MONTHLY",
          paidInstallments: account.type === "RECURRING_DEPOSIT" ? 12 : 0,
          totalInstallments: account.type === "RECURRING_DEPOSIT" ? 12 : null,
          startDate,
          maturityDate,
          maturityAmount,
          status: maturityDate <= new Date() ? "MATURED" : "ACTIVE",
          sourceAccountId: account.id,
        },
      });

      created += 1;
    }

    if (created > 0) {
      invalidateAfterDepositChange();
      revalidatePath("/couple/finance");
      revalidatePath("/couple/finance/deposits");
    }

    return { success: true as const, data: { created, scanned: legacyAccounts.length } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to migrate legacy deposits",
    };
  }
}
