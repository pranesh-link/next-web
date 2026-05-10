"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  Button,
  ErrorText,
  Field,
  FormActions,
  FormGrid,
  Input,
  Select,
} from "../_styled";
import type { Deposit, FieldErrors, FormState } from "../_utils";

type Props = {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Deposit being edited, or null for create mode. */
  editing: Deposit | null;
  /** Controlled form state. */
  form: FormState;
  /** Setter for form state (`setState`-style). */
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  /** Per-field error messages from server validation. */
  fieldErrors: FieldErrors;
  /** Top-level error string, if any. */
  submitError: string | null;
  /** True while save is in flight. */
  saving: boolean;
  /** Close the modal. */
  onClose: () => void;
  /** Submit the form. */
  onSubmit: () => void;
};

/**
 * Render the deposit create/edit modal with all form fields, validation
 * messages, and action buttons.
 *
 * @param props - {@link Props} bag with state, errors, and handlers.
 * @returns The modal element.
 */
export default function DepositFormModal({
  isOpen,
  editing,
  form,
  setForm,
  fieldErrors,
  submitError,
  saving,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? "Edit Deposit" : "Add Deposit"}>
      {submitError ? <ErrorText>{submitError}</ErrorText> : null}
      <FormGrid>
        <Field>
          Name
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          {fieldErrors.name?.[0] ? <ErrorText>{fieldErrors.name[0]}</ErrorText> : null}
        </Field>
        <Field>
          Provider
          <Input value={form.provider} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} />
          {fieldErrors.provider?.[0] ? <ErrorText>{fieldErrors.provider[0]}</ErrorText> : null}
        </Field>
        <Field>
          Type
          <Select
            value={form.type}
            onChange={(e) =>
              setForm((p) => {
                const nextType = e.target.value as FormState["type"];
                return {
                  ...p,
                  type: nextType,
                  installmentFrequency:
                    nextType === "RECURRING_DEPOSIT"
                      ? p.installmentFrequency || "MONTHLY"
                      : p.installmentFrequency,
                };
              })
            }
          >
            <option value="FIXED_DEPOSIT">Fixed Deposit</option>
            <option value="RECURRING_DEPOSIT">Recurring Deposit</option>
          </Select>
          {fieldErrors.type?.[0] ? <ErrorText>{fieldErrors.type[0]}</ErrorText> : null}
        </Field>
        <Field>
          Principal Amount
          <Input type="number" value={form.principalAmount} onChange={(e) => setForm((p) => ({ ...p, principalAmount: e.target.value }))} />
          {fieldErrors.principalAmount?.[0] ? <ErrorText>{fieldErrors.principalAmount[0]}</ErrorText> : null}
        </Field>
        <Field>
          Interest Rate (%)
          <Input type="number" value={form.interestRate} onChange={(e) => setForm((p) => ({ ...p, interestRate: e.target.value }))} />
          {fieldErrors.interestRate?.[0] ? <ErrorText>{fieldErrors.interestRate[0]}</ErrorText> : null}
        </Field>
        <Field>
          Tenure (months)
          <Input type="number" value={form.tenureMonths} onChange={(e) => setForm((p) => ({ ...p, tenureMonths: e.target.value }))} />
          {fieldErrors.tenureMonths?.[0] ? <ErrorText>{fieldErrors.tenureMonths[0]}</ErrorText> : null}
        </Field>
        <Field>
          Start Date
          <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
          {fieldErrors.startDate?.[0] ? <ErrorText>{fieldErrors.startDate[0]}</ErrorText> : null}
        </Field>
        <Field>
          Maturity Date
          <Input type="date" value={form.maturityDate} onChange={(e) => setForm((p) => ({ ...p, maturityDate: e.target.value }))} />
          {fieldErrors.maturityDate?.[0] ? <ErrorText>{fieldErrors.maturityDate[0]}</ErrorText> : null}
        </Field>
        {form.type === "RECURRING_DEPOSIT" && (
          <>
            <Field>
              Installment Amount
              <Input type="number" value={form.installmentAmount} onChange={(e) => setForm((p) => ({ ...p, installmentAmount: e.target.value }))} />
              {fieldErrors.installmentAmount?.[0] ? <ErrorText>{fieldErrors.installmentAmount[0]}</ErrorText> : null}
            </Field>
            <Field>
              Installment Frequency
              <Select
                value={form.installmentFrequency}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    installmentFrequency: e.target.value as FormState["installmentFrequency"],
                  }))
                }
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="HALF_YEARLY">Half-yearly</option>
                <option value="YEARLY">Yearly</option>
              </Select>
              {fieldErrors.installmentFrequency?.[0] ? <ErrorText>{fieldErrors.installmentFrequency[0]}</ErrorText> : null}
            </Field>
            <Field>
              Total Installments
              <Input type="number" value={form.totalInstallments} onChange={(e) => setForm((p) => ({ ...p, totalInstallments: e.target.value }))} />
              {fieldErrors.totalInstallments?.[0] ? <ErrorText>{fieldErrors.totalInstallments[0]}</ErrorText> : null}
            </Field>
          </>
        )}
      </FormGrid>

      <FormActions>
        <Button $variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button $variant="accent" onClick={onSubmit} disabled={saving}>
          {saving ? "Saving..." : editing ? "Update" : "Create"}
        </Button>
      </FormActions>
    </Modal>
  );
}
