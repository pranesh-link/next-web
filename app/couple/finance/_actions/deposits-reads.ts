"use server";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { depositInstruments, depositInstallments } from "@db/schema";
import { inArray, asc } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import {
  getExpectedInstallmentsTillDate,
  getNextScheduledInstallmentDate,
} from "./deposits-helpers";

/**
 * Fetch every deposit instrument for the couple, enriching RDs with derived schedule fields.
 *
 * For RDs, the result includes `paidInstallments`, `nextInstallmentDate`,
 * `expectedInstallmentsTillDate`, and `timeProgressPercentage`.
 *
 * @returns Result with the enriched deposit list, or an error.
 * @remarks Auth: requires session.
 */
export async function getDeposits() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const depositRows = await db.query.depositInstruments.findMany({
      where: inArray(depositInstruments.userId, coupleUserIds),
      orderBy: [asc(depositInstruments.maturityDate)],
    });

    const depositIds = depositRows.map((d) => d.id);
    const allInstallments =
      depositIds.length > 0
        ? await db.query.depositInstallments.findMany({
            where: inArray(depositInstallments.depositId, depositIds),
            orderBy: [asc(depositInstallments.dueDate)],
          })
        : [];
    const installmentsByDeposit = new Map<string, typeof allInstallments>();
    for (const inst of allInstallments) {
      if (!installmentsByDeposit.has(inst.depositId)) {
        installmentsByDeposit.set(inst.depositId, []);
      }
      installmentsByDeposit.get(inst.depositId)!.push(inst);
    }
    const deposits = depositRows.map((d) => ({ ...d, installments: installmentsByDeposit.get(d.id) ?? [] }));

    const enrichedDeposits = deposits.map((deposit) => {
      if (deposit.type !== "RECURRING_DEPOSIT") {
        return deposit;
      }

      const expectedInstallmentsTillDate = getExpectedInstallmentsTillDate({
        startDate: deposit.startDate,
        totalInstallments: deposit.totalInstallments,
        installmentFrequency: deposit.installmentFrequency,
      });
      const totalInstallments = deposit.totalInstallments ?? 0;
      const timeProgressPercentage = totalInstallments > 0
        ? Number(((expectedInstallmentsTillDate / totalInstallments) * 100).toFixed(2))
        : 0;
      const nextInstallmentDate = getNextScheduledInstallmentDate({
        startDate: deposit.startDate,
        totalInstallments: deposit.totalInstallments,
        installmentFrequency: deposit.installmentFrequency,
      });

      // RD installments are auto-deducted by the bank (like loan EMIs),
      // so paid count equals expected installments by date.
      const paidInstallments = expectedInstallmentsTillDate;

      return {
        ...deposit,
        paidInstallments,
        nextInstallmentDate,
        expectedInstallmentsTillDate,
        timeProgressPercentage,
      };
    });

    return { success: true as const, data: enrichedDeposits };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch deposits",
    };
  }
}

/**
 * Fetch a high-level summary of the couple's deposits (counts, totals, principals, maturity).
 *
 * @returns Result with `count`, `activeCount`, `totalPrincipal`, and `totalMaturity`, or an error.
 * @remarks Auth: requires session.
 */
export async function getDepositsSummary() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const depositSummaryRows = await db.query.depositInstruments.findMany({
      where: inArray(depositInstruments.userId, coupleUserIds),
      columns: {
        id: true,
        status: true,
        principalAmount: true,
        maturityAmount: true,
        installmentAmount: true,
        nextInstallmentDate: true,
      },
    });

    const active = depositSummaryRows.filter((d) => d.status === "ACTIVE");

    return {
      success: true as const,
      data: {
        count: depositSummaryRows.length,
        activeCount: active.length,
        totalPrincipal: active.reduce((sum, d) => sum + d.principalAmount, 0),
        totalMaturity: active.reduce((sum, d) => sum + d.maturityAmount, 0),
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch deposit summary",
    };
  }
}
