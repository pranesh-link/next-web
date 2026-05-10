"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import InvestmentCard from "./_components/InvestmentCard";
import InvestmentForm from "./_components/InvestmentForm";
import InvestmentSummary from "./_components/InvestmentSummary";
import { Grid, PageWrapper } from "./_styled";
import type { FieldErrors, FormState, Investment } from "./_types";
import { initialState } from "./_utils";

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
            <InvestmentSummary
              invested={totals.invested}
              current={totals.current}
              gainLoss={totals.gainLoss}
            />

            <Grid>
              {items.map((item) => (
                <InvestmentCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </Grid>
          </>
        )}
      </PageWrapper>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? "Edit Investment" : "Add Investment"}>
        <InvestmentForm
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          submitError={submitError}
          saving={saving}
          editing={Boolean(editing)}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </>
  );
}
