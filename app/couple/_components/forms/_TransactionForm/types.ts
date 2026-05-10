import { z } from "zod";
import { transactionSchema as canonicalTransactionSchema } from "@/_lib/validations/finance";

/**
 * Allowed transaction category labels (closed list).
 */
export const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Investment",
  "EMI",
  "Utilities",
  "Other",
] as const;

/**
 * Zod schema for the form-side transaction payload.
 *
 * @remarks Built from the canonical {@link canonicalTransactionSchema} and overrides
 * `accountId` (free string, not uuid), `description` (required, max 200), and
 * `date` (string instead of Date) to match form input semantics.
 */
export const transactionSchema = canonicalTransactionSchema.extend({
  accountId: z.string().min(1, "Account is required"),
  description: z.string().min(1, "Description is required").max(200),
  date: z.string().min(1, "Date is required"),
});

/**
 * Validated transaction data inferred from {@link transactionSchema}.
 */
export type TransactionData = z.infer<typeof transactionSchema>;

/**
 * Account option used to populate the account selector.
 */
export interface Account {
  /** Stable account id (foreign key persisted on the transaction). */
  id: string;
  /** Human-readable account name shown in the dropdown. */
  name: string;
}

/**
 * Props for the {@link TransactionForm} component.
 */
export interface TransactionFormProps {
  /** Accounts available for selection. */
  accounts: Account[];
  /** Optional partial seed values used when editing an existing transaction. */
  initialData?: Partial<TransactionData>;
  /** Async submit handler; receives a validated {@link TransactionData} payload. */
  onSubmit: (data: TransactionData) => Promise<void>;
  /** Optional cancel handler; renders a Cancel button when provided. */
  onCancel?: () => void;
  /** When true, disables inputs and shows a spinner on the submit button. */
  isLoading?: boolean;
}
