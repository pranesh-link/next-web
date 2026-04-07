"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  addDepositInstallment,
  createDeposit,
  deleteDeposit,
  getDeposits,
  migrateLegacyDepositAccounts,
  updateDeposit,
} from "@/couple/finance/_actions/deposits";

type Deposit = {
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

type FormState = {
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

const SummaryValue = styled.p`
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: var(--text);
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
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: var(--text);
`;

const Badge = styled.span<{ $active?: boolean }>`
  font-size: 11px;
  border-radius: 999px;
  padding: 3px 8px;
  border: 1px solid ${(p) => (p.$active ? "rgba(34,197,94,0.35)" : "var(--border)")};
  color: ${(p) => (p.$active ? "var(--success)" : "var(--text-muted)")};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-dim);
`;

const Value = styled.span`
  color: var(--text);
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
`;

const Button = styled.button<{ $variant?: "danger" | "ghost" | "accent" }>`
  border: 1px solid ${(p) => (p.$variant === "danger" ? "rgba(239,68,68,0.4)" : p.$variant === "accent" ? "transparent" : "var(--border)")};
  background: ${(p) => (p.$variant === "accent" ? "var(--accent)" : "var(--surface)")};
  color: ${(p) => (p.$variant === "danger" ? "var(--danger)" : p.$variant === "accent" ? "#fff" : "var(--text-muted)")};
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ${EASING};
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

const initialState: FormState = {
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

const LEGACY_MIGRATION_SESSION_KEY = "coupletastic_deposits_legacy_migrated";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function DepositsPage() {
  const [items, setItems] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deposit | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loadData = useCallback(async () => {
    const res = await getDeposits();
    if (res.success) setItems(res.data as Deposit[]);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        if (typeof window !== "undefined") {
          const alreadyMigrated = sessionStorage.getItem(LEGACY_MIGRATION_SESSION_KEY) === "1";

          if (!alreadyMigrated) {
            const migrationRes = await migrateLegacyDepositAccounts();
            if (migrationRes.success) {
              sessionStorage.setItem(LEGACY_MIGRATION_SESSION_KEY, "1");
            }
          }
        }

        await loadData();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadData]);

  const totals = useMemo(() => {
    const active = items.filter((item) => item.status === "ACTIVE");
    return {
      activeCount: active.length,
      principal: active.reduce((sum, item) => sum + item.principalAmount, 0),
      maturity: active.reduce((sum, item) => sum + item.maturityAmount, 0),
    };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialState);
    setSubmitError(null);
    setFieldErrors({});
    setOpen(true);
  };

  const openEdit = (item: Deposit) => {
    setEditing(item);
    setForm({
      name: item.name,
      provider: item.provider ?? "",
      type: item.type,
      installmentFrequency: item.installmentFrequency ?? "MONTHLY",
      principalAmount: String(item.principalAmount),
      interestRate: String(item.interestRate),
      tenureMonths: String(item.tenureMonths),
      installmentAmount: item.installmentAmount ? String(item.installmentAmount) : "",
      totalInstallments: item.totalInstallments ? String(item.totalInstallments) : "",
      startDate: new Date(item.startDate).toISOString().slice(0, 10),
      maturityDate: new Date(item.maturityDate).toISOString().slice(0, 10),
      nextInstallmentDate: item.nextInstallmentDate ? new Date(item.nextInstallmentDate).toISOString().slice(0, 10) : "",
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
      provider: form.provider || undefined,
      type: form.type,
      principalAmount: Number(form.principalAmount),
      interestRate: Number(form.interestRate),
      tenureMonths: Number(form.tenureMonths),
      installmentAmount: form.type === "RECURRING_DEPOSIT" ? Number(form.installmentAmount || 0) || undefined : undefined,
      totalInstallments: form.type === "RECURRING_DEPOSIT" ? Number(form.totalInstallments || 0) || undefined : undefined,
      startDate: form.startDate,
      maturityDate: form.maturityDate,
      ...(form.type === "RECURRING_DEPOSIT" ? { installmentFrequency: form.installmentFrequency } : {}),
    };

    const res = editing
      ? await updateDeposit(editing.id, payload)
      : await createDeposit(payload);

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
      : "Failed to save deposit";

    const firstFieldError = Object.values(serverFieldErrors)
      .flat()
      .find((message): message is string => Boolean(message));

    setFieldErrors(serverFieldErrors);
    setSubmitError(firstFieldError ?? fallbackError);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteDeposit(id);
    if (res.success) await loadData();
  };

  const markInstallmentPaid = async (item: Deposit) => {
    if (!item.installmentAmount) return;
    const nowIso = new Date().toISOString();
    const res = await addDepositInstallment({
      depositId: item.id,
      amount: item.installmentAmount,
      dueDate: item.nextInstallmentDate ? new Date(item.nextInstallmentDate).toISOString() : nowIso,
      paidDate: nowIso,
      status: "PAID",
    });
    if (res.success) await loadData();
  };

  return (
    <>
      <FinanceHeader
        title="Deposits"
        onRefresh={loadData}
        action={{ label: "Add Deposit", onClick: openCreate }}
      />

      <PageWrapper>
        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🏦"
            title="No deposits yet"
            description="Track fixed and recurring deposits, maturity, and installments."
          />
        ) : (
          <>
            <SummaryGrid>
              <SummaryCard>
                <SummaryLabel>Active Deposits</SummaryLabel>
                <SummaryValue>{totals.activeCount}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total Principal</SummaryLabel>
                <SummaryValue>{formatCurrency(totals.principal)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total Maturity</SummaryLabel>
                <SummaryValue>{formatCurrency(totals.maturity)}</SummaryValue>
              </SummaryCard>
            </SummaryGrid>

            <Grid>
              {items.map((item) => (
                <Card key={item.id}>
                  <CardTop>
                    <div>
                      <CardTitle>{item.name}</CardTitle>
                      <Badge $active={item.status === "ACTIVE"}>
                        {item.type === "FIXED_DEPOSIT" ? "FD" : "RD"} • {item.status}
                      </Badge>
                    </div>
                  </CardTop>

                  <Row>
                    <span>Principal</span>
                    <Value>{formatCurrency(item.principalAmount)}</Value>
                  </Row>
                  <Row>
                    <span>Maturity</span>
                    <Value>{formatCurrency(item.maturityAmount)}</Value>
                  </Row>
                  <Row>
                    <span>Maturity Date</span>
                    <Value>{new Date(item.maturityDate).toLocaleDateString("en-IN")}</Value>
                  </Row>
                  {item.type === "RECURRING_DEPOSIT" && (
                    <>
                      <Row>
                        <span>Installment</span>
                        <Value>{formatCurrency(item.installmentAmount ?? 0)}</Value>
                      </Row>
                      <Row>
                        <span>Paid Progress</span>
                        <Value>
                          {item.paidInstallments}/{item.totalInstallments ?? "-"}
                        </Value>
                      </Row>
                      <Row>
                        <span>Expected by Date</span>
                        <Value>{item.expectedInstallmentsTillDate ?? "-"}</Value>
                      </Row>
                      <Row>
                        <span>Time Progress</span>
                        <Value>
                          {typeof item.timeProgressPercentage === "number"
                            ? `${item.timeProgressPercentage.toFixed(1)}%`
                            : "-"}
                        </Value>
                      </Row>
                      <Row>
                        <span>Next Installment</span>
                        <Value>
                          {item.nextInstallmentDate
                            ? new Date(item.nextInstallmentDate).toLocaleDateString("en-IN")
                            : "-"}
                        </Value>
                      </Row>
                    </>
                  )}

                  <Actions>
                    <Button onClick={() => openEdit(item)}>Edit</Button>
                    <Button $variant="danger" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                    {item.type === "RECURRING_DEPOSIT" && item.status === "ACTIVE" ? (
                      <Button $variant="accent" onClick={() => markInstallmentPaid(item)}>
                        Mark Installment Paid
                      </Button>
                    ) : null}
                  </Actions>
                </Card>
              ))}
            </Grid>
          </>
        )}
      </PageWrapper>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? "Edit Deposit" : "Add Deposit"}>
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
          <Button $variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button $variant="accent" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </FormActions>
      </Modal>
    </>
  );
}
