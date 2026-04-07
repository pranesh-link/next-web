"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  createInvestment,
  deleteInvestment,
  getInvestments,
  updateInvestment,
} from "@/couple/finance/_actions/investments";

type Investment = {
  id: string;
  name: string;
  assetType: "GOLD" | "SILVER" | "STOCK" | "MUTUAL_FUND";
  mode: "LUMPSUM" | "SIP";
  ticker?: string | null;
  exchange?: "NSE" | "BSE" | null;
  quantity?: number | null;
  quantityGrams?: number | null;
  investedAmount: number;
  currentPrice?: number | null;
  currentValue?: number | null;
  sipAmount?: number | null;
  sipDayOfMonth?: number | null;
  startDate: string | Date;
  nextSipDate?: string | Date | null;
};

type FormState = {
  name: string;
  assetType: "GOLD" | "SILVER" | "STOCK" | "MUTUAL_FUND";
  mode: "LUMPSUM" | "SIP";
  ticker: string;
  exchange: "NSE" | "BSE";
  quantity: string;
  quantityGrams: string;
  investedAmount: string;
  currentValue: string;
  sipAmount: string;
  sipDayOfMonth: string;
  startDate: string;
  nextSipDate: string;
};

type FieldErrors = Partial<Record<keyof FormState, string[]>>;

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
`;

const SummaryLabel = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-muted);
`;

const SummaryValue = styled.p<{ $danger?: boolean }>`
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text)")};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s ${EASING};

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
    transform: translateY(-1px);
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: var(--text);
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const Badge = styled.span`
  font-size: 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 8px;
  color: var(--text-muted);
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-dim);
`;

const Value = styled.span<{ $good?: boolean; $bad?: boolean }>`
  color: ${(p) => (p.$good ? "var(--success)" : p.$bad ? "var(--danger)" : "var(--text)")};
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ $variant?: "danger" | "ghost" }>`
  border: 1px solid ${(p) => (p.$variant === "danger" ? "rgba(239,68,68,0.4)" : "var(--border)")};
  background: ${(p) => (p.$variant === "ghost" ? "transparent" : "var(--surface)")};
  color: ${(p) => (p.$variant === "danger" ? "var(--danger)" : "var(--text-muted)")};
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
`;

const Input = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
`;

const Select = styled.select`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
`;

const FormActions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ErrorText = styled.p`
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 12px;
`;

const PrimaryButton = styled.button`
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
`;

const initialState: FormState = {
  name: "",
  assetType: "MUTUAL_FUND",
  mode: "LUMPSUM",
  ticker: "",
  exchange: "NSE",
  quantity: "",
  quantityGrams: "",
  investedAmount: "",
  currentValue: "",
  sipAmount: "",
  sipDayOfMonth: "",
  startDate: new Date().toISOString().slice(0, 10),
  nextSipDate: "",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function InvestmentsPage() {
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loadData = useCallback(async () => {
    const res = await getInvestments();
    if (res.success) setItems(res.data as Investment[]);
  }, []);

  useEffect(() => {
    async function init() {
      await loadData();
      setLoading(false);
    }
    init();
  }, [loadData]);

  const totals = useMemo(() => {
    const invested = items.reduce((sum, item) => sum + item.investedAmount, 0);
    const current = items.reduce(
      (sum, item) => sum + (item.currentValue ?? item.investedAmount),
      0,
    );
    return { invested, current, gainLoss: current - invested };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialState);
    setSubmitError(null);
    setFieldErrors({});
    setOpen(true);
  };

  const openEdit = (item: Investment) => {
    setEditing(item);
    setForm({
      name: item.name,
      assetType: item.assetType,
      mode: item.mode,
      ticker: item.ticker ?? "",
      exchange: item.exchange ?? "NSE",
      quantity: item.quantity ? String(item.quantity) : "",
      quantityGrams: item.quantityGrams ? String(item.quantityGrams) : "",
      investedAmount: String(item.investedAmount),
      currentValue: item.currentValue ? String(item.currentValue) : "",
      sipAmount: item.sipAmount ? String(item.sipAmount) : "",
      sipDayOfMonth: item.sipDayOfMonth ? String(item.sipDayOfMonth) : "",
      startDate: new Date(item.startDate).toISOString().slice(0, 10),
      nextSipDate: item.nextSipDate ? new Date(item.nextSipDate).toISOString().slice(0, 10) : "",
    });
    setSubmitError(null);
    setFieldErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      name: form.name,
      assetType: form.assetType,
      mode: form.mode,
      ticker: form.assetType === "STOCK" ? form.ticker || undefined : undefined,
      exchange: form.assetType === "STOCK" ? form.exchange : undefined,
      quantity: form.assetType === "STOCK" || form.assetType === "MUTUAL_FUND" ? Number(form.quantity || 0) || undefined : undefined,
      quantityGrams: form.assetType === "GOLD" || form.assetType === "SILVER" ? Number(form.quantityGrams || 0) || undefined : undefined,
      investedAmount: Number(form.investedAmount),
      currentValue: Number(form.currentValue || 0) || undefined,
      sipAmount: form.mode === "SIP" ? Number(form.sipAmount || 0) || undefined : undefined,
      sipDayOfMonth: form.mode === "SIP" ? Number(form.sipDayOfMonth || 0) || undefined : undefined,
      startDate: form.startDate,
      nextSipDate: form.mode === "SIP" && form.nextSipDate ? form.nextSipDate : undefined,
    };

    const res = editing
      ? await updateInvestment(editing.id, payload)
      : await createInvestment(payload);

    setSaving(false);
    if (res.success) {
      setOpen(false);
      await loadData();
      return;
    }

    const serverFieldErrors = "validationErrors" in res && res.validationErrors
      ? (res.validationErrors as FieldErrors)
      : {};

    const fallbackError = "error" in res && typeof res.error === "string"
      ? res.error
      : "Failed to save investment";

    const firstFieldError = Object.values(serverFieldErrors)
      .flat()
      .find((message): message is string => Boolean(message));

    setFieldErrors(serverFieldErrors);
    setSubmitError(firstFieldError ?? fallbackError);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteInvestment(id);
    if (res.success) await loadData();
  };

  return (
    <>
      <FinanceHeader
        title="Investments"
        onRefresh={loadData}
        action={{ label: "Add Investment", onClick: openCreate }}
      />
      <PageWrapper>
        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="💎"
            title="No investments yet"
            description="Track gold, silver, stocks, and SIP holdings here."
          />
        ) : (
          <>
            <SummaryGrid>
              <SummaryCard>
                <SummaryLabel>Total Invested</SummaryLabel>
                <SummaryValue>{formatCurrency(totals.invested)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Current Value</SummaryLabel>
                <SummaryValue>{formatCurrency(totals.current)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Gain/Loss</SummaryLabel>
                <SummaryValue $danger={totals.gainLoss < 0}>
                  {formatCurrency(totals.gainLoss)}
                </SummaryValue>
              </SummaryCard>
            </SummaryGrid>

            <Grid>
              {items.map((item) => {
                const current = item.currentValue ?? item.investedAmount;
                const pnl = current - item.investedAmount;
                return (
                  <Card key={item.id}>
                    <CardTop>
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <BadgeRow>
                          <Badge>{item.assetType.replace("_", " ")}</Badge>
                          <Badge>{item.mode}</Badge>
                          {item.exchange && <Badge>{item.exchange}</Badge>}
                        </BadgeRow>
                      </div>
                      <Actions>
                        <Button onClick={() => openEdit(item)}>Edit</Button>
                        <Button $variant="danger" onClick={() => handleDelete(item.id)}>
                          Delete
                        </Button>
                      </Actions>
                    </CardTop>

                    <Row>
                      <span>Invested</span>
                      <Value>{formatCurrency(item.investedAmount)}</Value>
                    </Row>
                    <Row>
                      <span>Current</span>
                      <Value>{formatCurrency(current)}</Value>
                    </Row>
                    <Row>
                      <span>P/L</span>
                      <Value $good={pnl >= 0} $bad={pnl < 0}>
                        {formatCurrency(pnl)}
                      </Value>
                    </Row>
                    {item.assetType === "STOCK" && item.quantity ? (
                      <Row>
                        <span>Qty</span>
                        <Value>{item.quantity}</Value>
                      </Row>
                    ) : null}
                    {(item.assetType === "GOLD" || item.assetType === "SILVER") && item.quantityGrams ? (
                      <Row>
                        <span>Weight</span>
                        <Value>{item.quantityGrams} g</Value>
                      </Row>
                    ) : null}
                    {item.mode === "SIP" && item.sipAmount ? (
                      <Row>
                        <span>SIP</span>
                        <Value>{formatCurrency(item.sipAmount)}</Value>
                      </Row>
                    ) : null}
                  </Card>
                );
              })}
            </Grid>
          </>
        )}
      </PageWrapper>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? "Edit Investment" : "Add Investment"}>
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
          <Button $variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <PrimaryButton onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </PrimaryButton>
        </FormActions>
      </Modal>
    </>
  );
}
