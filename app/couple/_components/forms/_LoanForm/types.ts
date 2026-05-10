import { z } from "zod";
import { loanSchema as canonicalLoanSchema } from "@/_lib/validations/finance";

/**
 * Zod schema for the form-side loan payload.
 *
 * @remarks Built from the canonical {@link canonicalLoanSchema}. Drops fields
 * the form does not collect (`principal`, `scheduleGeneratedOn`, `prepayments`,
 * `schedule`) and overrides the rest to match form input semantics: renames
 * `principal` to `principalAmount`, allows `emiAmount` of 0, accepts a string
 * `startDate`, relaxes the interest-rate ceiling, and uses form-specific error
 * messages.
 */
export const loanSchema = canonicalLoanSchema
  .omit({
    principal: true,
    scheduleGeneratedOn: true,
    prepayments: true,
    schedule: true,
  })
  .extend({
    name: z.string().min(1, "Loan name is required").max(100),
    principalAmount: z.number().positive("Principal must be positive"),
    interestRate: z
      .number()
      .min(0, "Interest rate cannot be negative")
      .max(100, "Interest rate too high"),
    tenureMonths: z.number().int().positive("Tenure must be at least 1 month"),
    emiAmount: z.number().min(0, "EMI cannot be negative"),
    startDate: z.string().min(1, "Start date is required"),
    remainingBalance: z
      .number()
      .min(0, "Remaining balance cannot be negative"),
  });

/**
 * Validated loan data inferred from {@link loanSchema}.
 */
export type LoanData = z.infer<typeof loanSchema>;

/**
 * Props for the {@link LoanForm} component.
 */
export interface LoanFormProps {
  /** Optional partial seed values used when editing an existing loan. */
  initialData?: Partial<
    LoanData & {
      loanProvider?: string | null;
      loanAccountNumber?: string | null;
    }
  >;
  /** Async submit handler; receives a validated {@link LoanData} payload. */
  onSubmit: (data: LoanData) => Promise<void>;
  /** Optional cancel handler; renders a Cancel button when provided. */
  onCancel?: () => void;
  /** When true, disables inputs and shows a spinner on the submit button. */
  isLoading?: boolean;
}
