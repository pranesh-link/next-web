"use server";

import { requireAuthForAction } from "@/_lib/auth-utils";
import { prisma } from "@/_lib/prisma";
import { revalidatePath } from "next/cache";

/** Profile and finance settings for the signed-in user. */
export interface UserSettings {
  /** Display name. */
  name: string | null;
  /** Email address. */
  email: string;
  /** Preferred currency code (e.g. "INR"). */
  currency: string;
  /** Monthly income in the preferred currency. */
  monthlyIncome: number | null;
}

/** Notification preference toggles. Phase 1: stored locally only. */
export interface NotificationPreferences {
  /** Whether to receive budget overage alerts. */
  budgetAlerts: boolean;
  /** Whether to receive SIP due reminders. */
  sipReminders: boolean;
  /** Whether to receive deposit installment reminders. */
  depositReminders: boolean;
}

/**
 * Fetch profile settings for the signed-in user.
 *
 * @returns The user's name, email, currency, and monthly income.
 * @remarks Auth: requires session.
 */
export async function getUserSettings(): Promise<
  { success: true; data: UserSettings } | { success: false; error: string }
> {
  const user = await requireAuthForAction();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, currency: true, monthlyIncome: true },
    });
    if (!dbUser) return { success: false, error: "User not found" };
    return { success: true, data: dbUser };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to get settings",
    };
  }
}

/**
 * Update profile settings for the signed-in user.
 *
 * @param data - Partial settings to update.
 * @returns Success indicator.
 * @remarks Auth: requires session. Revalidates `/couple`.
 */
export async function updateUserSettings(data: {
  name?: string;
  currency?: string;
  monthlyIncome?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireAuthForAction();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.monthlyIncome !== undefined && {
          monthlyIncome: data.monthlyIncome,
        }),
      },
    });
    revalidatePath("/couple");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update settings",
    };
  }
}

/**
 * Fetch notification preferences for the signed-in user.
 *
 * @returns The user's notification preference toggles.
 * @remarks Auth: requires session. Phase 1: returns hardcoded defaults.
 */
export async function getNotificationPreferences(): Promise<
  | { success: true; data: NotificationPreferences }
  | { success: false; error: string }
> {
  const user = await requireAuthForAction();
  if (!user) return { success: false, error: "Not authenticated" };

  return {
    success: true,
    data: { budgetAlerts: true, sipReminders: true, depositReminders: true },
  };
}
