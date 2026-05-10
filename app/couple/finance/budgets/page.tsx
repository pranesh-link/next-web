"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getBudgetStatus,
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/couple/finance/_actions/budgets";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import BudgetForm from "@/couple/_components/forms/BudgetForm";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

import type { BudgetItem, Notification } from "./_utils";
import { getCurrentMonth } from "./_utils";
import {
  PageWrapper,
  BudgetGrid,
  NotificationBanner,
  ErrorBanner,
} from "./_styled";
import MonthSelectorBar from "./_components/MonthSelectorBar";
import BudgetsSummarySection from "./_components/BudgetsSummarySection";
import BudgetCardItem from "./_components/BudgetCardItem";
import DeleteConfirmModal from "./_components/DeleteConfirmModal";
import { NOTIFICATION_TIMINGS } from "@/couple/_constants/animation";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState(getCurrentMonth);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetItem | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), NOTIFICATION_TIMINGS.fadeOutMs);
    }, NOTIFICATION_TIMINGS.displayMs);
  }, []);

  const fetchBudgets = useCallback(async () => {
    const result = await getBudgetStatus(month);
    if (result.success) {
      setBudgets(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [month]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await fetchBudgets();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load budgets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchBudgets]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.budget.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  function handleOpenAdd() {
    setEditTarget(null);
    setShowModal(true);
  }

  function handleEdit(item: BudgetItem) {
    setEditTarget(item);
    setShowModal(true);
  }

  function handleDeletePrompt(id: string) {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const result = await deleteBudget(deleteTargetId);
    setSubmitting(false);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (result.success) {
      notify("Budget deleted", "success");
      await fetchBudgets();
    } else {
      notify(result.error, "error");
    }
  }

  async function handleFormSubmit(data: {
    category: string;
    monthlyLimit: number;
    month: string;
  }) {
    setSubmitting(true);

    const result = editTarget
      ? await updateBudget(editTarget.budget.id, { limit: data.monthlyLimit })
      : await createBudget({
          category: data.category,
          limit: data.monthlyLimit,
          month: data.month,
        });

    setSubmitting(false);

    if (result.success) {
      notify(editTarget ? "Budget updated" : "Budget created", "success");
      setShowModal(false);
      setEditTarget(null);
      await fetchBudgets();
    } else {
      notify(result.error, "error");
    }
  }

  return (
    <>
      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <FinanceHeader
        title="Budgets"
        action={{ label: "Set Budget", onClick: handleOpenAdd }}
        onRefresh={fetchBudgets}
      />

      <PageWrapper>
        <MonthSelectorBar month={month} onChange={setMonth} />

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {loading ? (
          <LoadingSkeleton type="card" count={6} />
        ) : budgets.length === 0 ? (
          <EmptyState
            title="No budgets set"
            description="Create your first budget to start tracking spending against your limits."
            action={{ label: "Set Budget", onClick: handleOpenAdd }}
          />
        ) : (
          <>
            <BudgetsSummarySection
              totalBudgeted={totalBudgeted}
              totalSpent={totalSpent}
              totalRemaining={totalRemaining}
            />

            <BudgetGrid>
              {budgets.map((item) => (
                <BudgetCardItem
                  key={item.budget.id}
                  item={item}
                  onEdit={handleEdit}
                  onDeletePrompt={handleDeletePrompt}
                />
              ))}
            </BudgetGrid>
          </>
        )}
      </PageWrapper>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTarget(null);
        }}
        title={editTarget ? "Edit Budget" : "Set Budget"}
      >
        <BudgetForm
          initialData={
            editTarget
              ? {
                  category: editTarget.budget.category,
                  monthlyLimit: editTarget.budget.limit,
                  month: editTarget.budget.month,
                }
              : { month }
          }
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          isLoading={submitting}
        />
      </Modal>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        submitting={submitting}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
