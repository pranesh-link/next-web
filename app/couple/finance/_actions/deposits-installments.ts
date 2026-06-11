"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { depositInstruments, depositInstallments } from "@db/schema";
import { eq, and, inArray, gte, lte, isNotNull, sql } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { depositInstallmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { createNotification } from "@/_services/finance/notification-service";
import { invalidateAfterDepositChange } from "@/_lib/cache";
import {
  monthKey,
  toStartOfDay,
  getNextScheduledInstallmentDate,
  formatActionError,
} from "./deposits-helpers";

/**
 * Add an installment row to a deposit. For RDs, also bumps `paidInstallments` and recomputes `nextInstallmentDate`.
 *
 * @param data - Installment payload (deposit id, amount, due date, optional paid date and status).
 * @returns The created installment on success; an error result with optional `validationErrors` on failure.
 * @remarks Auth: requires session. Revalidates `/couple/finance` and `/couple/finance/deposits`.
 */
export async function addDepositInstallment(data: {
  depositId: string;
  amount: number;
  dueDate: string | Date;
  paidDate?: string | Date;
  status?: "PENDING" | "PAID" | "MISSED";
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = depositInstallmentSchema.parse(data);

    const deposit = await db.query.depositInstruments.findFirst({
      where: and(
        eq(depositInstruments.id, validated.depositId),
        inArray(depositInstruments.userId, await getUserIdsForCouple(user.id)),
      ),
    });

    if (!deposit) {
      return { success: false as const, error: "Deposit not found" };
    }

    const installment = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(depositInstallments)
        .values({
          depositId: validated.depositId,
          amount: validated.amount,
          dueDate: validated.dueDate,
          paidDate: validated.paidDate,
          status: validated.status,
        })
        .returning();

      if (deposit.type === "RECURRING_DEPOSIT" && validated.status === "PAID") {
        const nextInstallmentDate = getNextScheduledInstallmentDate({
          startDate: deposit.startDate,
          totalInstallments: deposit.totalInstallments,
          installmentFrequency: deposit.installmentFrequency,
        });

        await tx
          .update(depositInstruments)
          .set({
            paidInstallments: sql`${depositInstruments.paidInstallments} + 1`,
            nextInstallmentDate,
          })
          .where(eq(depositInstruments.id, deposit.id));
      } else if (deposit.type === "RECURRING_DEPOSIT") {
        const nextInstallmentDate = getNextScheduledInstallmentDate({
          startDate: deposit.startDate,
          totalInstallments: deposit.totalInstallments,
          installmentFrequency: deposit.installmentFrequency,
        });

        await tx
          .update(depositInstruments)
          .set({ nextInstallmentDate })
          .where(eq(depositInstruments.id, deposit.id));
      }

      return created;
    });

    invalidateAfterDepositChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/deposits");
    return { success: true as const, data: installment };
  } catch (error) {
    return {
      success: false as const,
      ...formatActionError(error, "Failed to add installment"),
    };
  }
}

/**
 * Create reminders for upcoming deposit maturities and pending RD installments due within 7 days.
 *
 * Idempotency is delegated to {@link createNotification}, which uses a deterministic
 * key per deposit (and per month for RD installments).
 *
 * @param userId - The user the reminders should be addressed to (couple data is expanded internally).
 * @returns An object containing `created`: the number of notifications created.
 */
export async function syncDepositReminders(userId: string) {
  noStore();
  const coupleUserIds = await getUserIdsForCouple(userId);
  const now = toStartOfDay(new Date());
  const sevenDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const [maturing, pendingRd] = await Promise.all([
    db.query.depositInstruments.findMany({
      where: and(
        inArray(depositInstruments.userId, coupleUserIds),
        eq(depositInstruments.status, "ACTIVE"),
        lte(depositInstruments.maturityDate, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)),
      ),
      columns: { id: true },
    }),
    db.query.depositInstruments.findMany({
      where: and(
        inArray(depositInstruments.userId, coupleUserIds),
        eq(depositInstruments.type, "RECURRING_DEPOSIT"),
        eq(depositInstruments.status, "ACTIVE"),
        isNotNull(depositInstruments.nextInstallmentDate),
        gte(depositInstruments.nextInstallmentDate, now),
        lte(depositInstruments.nextInstallmentDate, sevenDaysFromNow),
      ),
      columns: { id: true },
    }),
  ]);

  const month = monthKey(now);

  for (const deposit of maturing) {
    await createNotification(userId, "DEPOSIT_MATURITY_REMINDER", deposit.id);
  }

  for (const deposit of pendingRd) {
    await createNotification(userId, "DEPOSIT_INSTALLMENT_REMINDER", `${deposit.id}:${month}`);
  }

  return { created: maturing.length + pendingRd.length };
}
