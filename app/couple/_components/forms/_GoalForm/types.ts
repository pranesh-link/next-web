import { z } from "zod";
import { goalSchema as canonicalGoalSchema } from "@/_lib/validations/finance";

/**
 * Zod schema for the form-side savings goal payload.
 *
 * @remarks Built from the canonical {@link canonicalGoalSchema}. Overrides
 * `name` (adds max-100 + form-specific message), `currentAmount` (drops the
 * default to make it explicit at the form layer), and `deadline` (string
 * instead of Date so it can bind directly to the date input).
 */
export const goalSchema = canonicalGoalSchema.extend({
  name: z.string().min(1, "Goal name is required").max(100),
  currentAmount: z.number().min(0, "Current amount cannot be negative"),
  deadline: z.string().optional(),
});

/**
 * Validated savings goal data inferred from {@link goalSchema}.
 */
export type GoalData = z.infer<typeof goalSchema>;

/**
 * Props for the {@link GoalForm} component.
 */
export interface GoalFormProps {
  /** Optional partial seed values used when editing an existing goal. */
  initialData?: Partial<GoalData>;
  /** Async submit handler; receives a fully validated {@link GoalData} payload. */
  onSubmit: (data: GoalData) => Promise<void>;
  /** Optional cancel handler; renders a Cancel button when provided. */
  onCancel?: () => void;
  /** When true, disables inputs and shows a spinner on the submit button. */
  isLoading?: boolean;
}
