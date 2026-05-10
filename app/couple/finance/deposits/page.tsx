"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
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
import DepositCard from "./_components/DepositCard";
import DepositFormModal from "./_components/DepositFormModal";
import {
  Grid,
  PageWrapper,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryValue,
} from "./_styled";
import {
  formatCurrency,
  initialFormState,
  LEGACY_MIGRATION_SESSION_KEY,
  type Deposit,
  type FieldErrors,
  type FormState,
} from "./_utils";

/**
 * Deposits page — lists all deposits, summary totals, and the create/edit
 * deposit modal.
 *
 * On first mount runs a one-time legacy account → deposit migration (gated
 * by sessionStorage) before fetching the user's deposits.
 *
 * @returns The deposits page element.
 */
export default function DepositsPage() {
  const [items, setItems] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deposit | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
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
    setForm(initialFormState);
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
                <DepositCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onMarkInstallmentPaid={markInstallmentPaid}
                />
              ))}
            </Grid>
          </>
        )}
      </PageWrapper>

      <DepositFormModal
        isOpen={open}
        editing={editing}
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        submitError={submitError}
        saving={saving}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
