"use client";

/**
 * Types, constants, and helpers shared across deposits page sub-components.
 */

/** A deposit row as returned by the deposits server action. */
export type Deposit = {
  id: string;
  name: string;
  provider?: string | null;
  type: "RECURRING_DEPOSIT" | "FIXED_DEPOSIT";
  installmentFrequency?: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY" | null;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  installmentAmount?: number | null;
  paidInstallments: number;
  totalInstallments?: number | null;
  expectedInstallmentsTillDate?: number | null;
  timeProgressPercentage?: number | null;
  startDate: string | Date;
  maturityDate: string | Date;
  maturityAmount: number;
  nextInstallmentDate?: string | Date | null;
  status: "ACTIVE" | "MATURED";
};

/** Controlled-input form state for the create/edit deposit modal. */
export type FormState = {
  name: string;
  provider: string;
  type: "RECURRING_DEPOSIT" | "FIXED_DEPOSIT";
  installmentFrequency: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";
  principalAmount: string;
  interestRate: string;
  tenureMonths: string;
  installmentAmount: string;
  totalInstallments: string;
  startDate: string;
  maturityDate: string;
  nextInstallmentDate: string;
};

/** Per-field error messages keyed by form field name. */
export type FieldErrors = Partial<Record<keyof FormState, string[]>>;

/** Default values used when opening the create-deposit modal. */
export const initialFormState: FormState = {
  name: "",
  provider: "",
  type: "FIXED_DEPOSIT",
  installmentFrequency: "MONTHLY",
  principalAmount: "",
  interestRate: "",
  tenureMonths: "12",
  installmentAmount: "",
  totalInstallments: "",
  startDate: new Date().toISOString().slice(0, 10),
  maturityDate: "",
  nextInstallmentDate: "",
};

/** Session-storage key that records the one-time legacy migration. */
export const LEGACY_MIGRATION_SESSION_KEY = "luvverse_deposits_legacy_migrated";

export { formatCurrency } from "@/_lib/formatters";
