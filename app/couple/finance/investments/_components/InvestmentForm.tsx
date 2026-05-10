"use client";

import {
  Button,
  ErrorText,
  Field,
  FormActions,
  FormGrid,
  Input,
  PrimaryButton,
  Select,
} from "../_styled";
import type { FieldErrors, FormState } from "../_types";

type Props = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  fieldErrors: FieldErrors;
  submitError: string | null;
  saving: boolean;
  editing: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function InvestmentForm({
  form,
  setForm,
  fieldErrors,
  submitError,
  saving,
  editing,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <>
      {submitError ? <ErrorText>{submitError}</ErrorText> : null}
      <FormGrid>
        <Field>
          Name
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          {fieldErrors.name?.[0] ? <ErrorText>{fieldErrors.name[0]}</ErrorText> : null}
        </Field>
        <Field>
          Asset Type
          <Select value={form.assetType} onChange={(e) => setForm((p) => ({ ...p, assetType: e.target.value as FormState["assetType"] }))}>
            <option value="MUTUAL_FUND">Mutual Fund</option>
            <option value="STOCK">Stock</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </Select>
          {fieldErrors.assetType?.[0] ? <ErrorText>{fieldErrors.assetType[0]}</ErrorText> : null}
        </Field>
        <Field>
          Mode
          <Select value={form.mode} onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value as FormState["mode"] }))}>
            <option value="LUMPSUM">Lumpsum</option>
            <option value="SIP">SIP</option>
          </Select>
          {fieldErrors.mode?.[0] ? <ErrorText>{fieldErrors.mode[0]}</ErrorText> : null}
        </Field>
        <Field>
          Start Date
          <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
          {fieldErrors.startDate?.[0] ? <ErrorText>{fieldErrors.startDate[0]}</ErrorText> : null}
        </Field>

        {form.assetType === "STOCK" && (
          <>
            <Field>
              Ticker
              <Input value={form.ticker} onChange={(e) => setForm((p) => ({ ...p, ticker: e.target.value.toUpperCase() }))} />
              {fieldErrors.ticker?.[0] ? <ErrorText>{fieldErrors.ticker[0]}</ErrorText> : null}
            </Field>
            <Field>
              Exchange
              <Select value={form.exchange} onChange={(e) => setForm((p) => ({ ...p, exchange: e.target.value as "NSE" | "BSE" }))}>
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
              </Select>
              {fieldErrors.exchange?.[0] ? <ErrorText>{fieldErrors.exchange[0]}</ErrorText> : null}
            </Field>
            <Field>
              Quantity
              <Input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
              {fieldErrors.quantity?.[0] ? <ErrorText>{fieldErrors.quantity[0]}</ErrorText> : null}
            </Field>
          </>
        )}

        {(form.assetType === "GOLD" || form.assetType === "SILVER") && (
          <Field>
            Weight (grams)
            <Input type="number" value={form.quantityGrams} onChange={(e) => setForm((p) => ({ ...p, quantityGrams: e.target.value }))} />
            {fieldErrors.quantityGrams?.[0] ? <ErrorText>{fieldErrors.quantityGrams[0]}</ErrorText> : null}
          </Field>
        )}

        <Field>
          Invested Amount
          <Input type="number" value={form.investedAmount} onChange={(e) => setForm((p) => ({ ...p, investedAmount: e.target.value }))} />
          {fieldErrors.investedAmount?.[0] ? <ErrorText>{fieldErrors.investedAmount[0]}</ErrorText> : null}
        </Field>
        <Field>
          Current Value (manual)
          <Input type="number" value={form.currentValue} onChange={(e) => setForm((p) => ({ ...p, currentValue: e.target.value }))} />
          {fieldErrors.currentValue?.[0] ? <ErrorText>{fieldErrors.currentValue[0]}</ErrorText> : null}
        </Field>

        {form.mode === "SIP" && (
          <>
            <Field>
              SIP Amount
              <Input type="number" value={form.sipAmount} onChange={(e) => setForm((p) => ({ ...p, sipAmount: e.target.value }))} />
              {fieldErrors.sipAmount?.[0] ? <ErrorText>{fieldErrors.sipAmount[0]}</ErrorText> : null}
            </Field>
            <Field>
              SIP Day (1-31)
              <Input type="number" value={form.sipDayOfMonth} onChange={(e) => setForm((p) => ({ ...p, sipDayOfMonth: e.target.value }))} />
              {fieldErrors.sipDayOfMonth?.[0] ? <ErrorText>{fieldErrors.sipDayOfMonth[0]}</ErrorText> : null}
            </Field>
            <Field>
              Next SIP Date
              <Input type="date" value={form.nextSipDate} onChange={(e) => setForm((p) => ({ ...p, nextSipDate: e.target.value }))} />
              {fieldErrors.nextSipDate?.[0] ? <ErrorText>{fieldErrors.nextSipDate[0]}</ErrorText> : null}
            </Field>
          </>
        )}
      </FormGrid>

      <FormActions>
        <Button $variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <PrimaryButton onClick={onSubmit} disabled={saving}>
          {saving ? "Saving..." : editing ? "Update" : "Create"}
        </PrimaryButton>
      </FormActions>
    </>
  );
}
