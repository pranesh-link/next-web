"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { depositInstallmentSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
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

    const deposit = await prisma.depositInstrument.findFirst({
      where: {
        id: validated.depositId,
        userId: { in: await getUserIdsForCouple(user.id) },
      },
    });

    if (!deposit) {
      return { success: false as const, error: "Deposit not found" };
    }

    const installment = await prisma.$transaction(async (tx) => {
      const created = await tx.depositInstallment.create({
        data: {
          depositId: validated.depositId,
          amount: validated.amount,
          dueDate: validated.dueDate,
          paidDate: validated.paidDate,
          status: validated.status,
        },
      });

      if (deposit.type === "RECURRING_DEPOSIT" && validated.status === "PAID") {
        const nextInstallmentDate = getNextScheduledInstallmentDate({
          startDate: deposit.startDate,
          totalInstallments: deposit.totalInstallments,
          installmentFrequency: deposit.installmentFrequency,
        });

        await tx.depositInstrument.update({
          where: { id: deposit.id },
          data: {
            paidInstallments: { increment: 1 },
            nextInstallmentDate,
          },
        });
      } else if (deposit.type === "RECURRING_DEPOSIT") {
        const nextInstallmentDate = getNextScheduledInstallmentDate({
          startDate: deposit.startDate,
          totalInstallments: deposit.totalInstallments,
          installmentFrequency: deposit.installmentFrequency,
        });

        await tx.depositInstrument.update({
          where: { id: deposit.id },
          data: { nextInstallmentDate },
        });
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
 * NOTE: Deposit reminders have been disabled.
 * Notifications are now only created for COUPLE_INVITE and BUDGET_ALERT types.
 * Deposit-related notifications are no longer generated.
 *
 * @deprecated This function no longer creates notifications.
 */
export async function syncDepositReminders(userId: string) {
  noStore();
  // Notifications are disabled for deposits.
  // Just return empty result.
  return { created: 0 };
}
