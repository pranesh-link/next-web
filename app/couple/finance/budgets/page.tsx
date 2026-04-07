"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
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

/* ── Types ──────────────────────────────────────────── */

type BudgetItem = {
  budget: {
    id: string;
    category: string;
    limit: number;
    month: string;
  };
  spent: number;
  remaining: number;
  exceeded: boolean;
};

type Notification = {
  message: string;
  type: "success" | "error";
};

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Helpers ────────────────────────────────────────── */

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

/* ── Keyframes ──────────────────────────────────────── */

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const fillExpand = keyframes`
  from { width: 0%; }
`;

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;
  max-width: 100%;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

/* ── Month Selector ── */

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const MonthArrowButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MonthLabel = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const MonthInput = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

/* ── Summary Cards ── */

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

const SummaryLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const SummaryValue = styled.p<{ $color?: string }>`
  font-size: 24px;
  font-weight: 800;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
  letter-spacing: -1px;
`;

/* ── Budget Cards Grid ── */

const BudgetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const BudgetCard = styled.div<{ $exceeded: boolean }>`
  background: var(--surface);
  border: 1px solid
    ${(p) =>
      p.$exceeded ? "rgba(239, 68, 68, 0.3)" : "var(--border)"};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: ${(p) =>
      p.$exceeded
        ? "rgba(239, 68, 68, 0.5)"
        : "rgba(59, 130, 246, 0.3)"};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px
      ${(p) =>
        p.$exceeded
          ? "rgba(239, 68, 68, 0.08)"
          : "rgba(59, 130, 246, 0.08)"};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CategoryName = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
`;

const ExceededBadge = styled.span`
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 6px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 2px;
`;

const IconButton = styled.button<{ $variant?: "edit" | "delete" }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    color: ${(p) =>
      p.$variant === "delete" ? "var(--danger)" : "var(--accent)"};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--surface-hover);
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressFill = styled.div<{ $width: number; $exceeded: boolean }>`
  height: 100%;
  border-radius: 6px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) =>
    p.$exceeded
      ? "var(--danger)"
      : "linear-gradient(90deg, var(--accent), #22d3ee)"};
  transition: width 1s ${EASING};
  animation: ${fillExpand} 0.8s ${EASING};
`;

const AmountRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

const SpentAmount = styled.span<{ $exceeded: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => (p.$exceeded ? "var(--danger)" : "var(--text)")};
`;

const LimitAmount = styled.span`
  font-size: 13px;
  color: var(--text-muted);
`;

const RemainingText = styled.p<{ $exceeded: boolean }>`
  font-size: 12px;
  color: ${(p) => (p.$exceeded ? "var(--danger)" : "var(--text-dim)")};
  margin: 4px 0 0 0;
`;

/* ── Delete Confirm ── */

const ConfirmBody = styled.div`
  text-align: center;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  color: var(--text-dim);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ConfirmButton = styled.button<{ $variant: "danger" | "cancel" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  background: ${(p) =>
    p.$variant === "danger" ? "var(--danger)" : "var(--surface)"};
  color: ${(p) => (p.$variant === "danger" ? "#fff" : "var(--text)")};
  border: 1px solid
    ${(p) => (p.$variant === "danger" ? "var(--danger)" : "var(--border)")};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ── Notification ── */

const NotificationBanner = styled.div<{
  $type: "success" | "error";
  $leaving: boolean;
}>`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: ${(p) =>
    p.$type === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  border: 1px solid
    ${(p) =>
      p.$type === "success"
        ? "rgba(34, 197, 94, 0.4)"
        : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) =>
    p.$type === "success" ? "var(--success)" : "var(--danger)"};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
  pointer-events: none;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
`;

/* ── Component ──────────────────────────────────────── */

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

  /* ── Notification helper ── */

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  }, []);

  /* ── Data fetching ── */

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

  /* ── Summary computation ── */

  const totalBudgeted = budgets.reduce((s, b) => s + b.budget.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  /* ── Handlers ── */

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

  /* ── Render ── */

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
        {/* Month Selector */}
        <MonthSelector>
          <MonthArrowButton
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Previous month"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </MonthArrowButton>

          <MonthLabel>{formatMonthLabel(month)}</MonthLabel>

          <MonthArrowButton
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Next month"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </MonthArrowButton>

          <MonthInput
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
            aria-label="Select month"
          />
        </MonthSelector>

        {/* Error */}
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
            {/* Summary */}
            <SummaryRow>
              <SummaryCard>
                <SummaryLabel>Total Budgeted</SummaryLabel>
                <SummaryValue>{formatCurrency(totalBudgeted)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total Spent</SummaryLabel>
                <SummaryValue
                  $color={
                    totalSpent > totalBudgeted
                      ? "var(--danger)"
                      : "var(--text)"
                  }
                >
                  {formatCurrency(totalSpent)}
                </SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total Remaining</SummaryLabel>
                <SummaryValue
                  $color={
                    totalRemaining < 0 ? "var(--danger)" : "var(--success)"
                  }
                >
                  {formatCurrency(totalRemaining)}
                </SummaryValue>
              </SummaryCard>
            </SummaryRow>

            {/* Budget Cards */}
            <BudgetGrid>
              {budgets.map((item) => {
                const pct =
                  item.budget.limit > 0
                    ? (item.spent / item.budget.limit) * 100
                    : 0;

                return (
                  <BudgetCard
                    key={item.budget.id}
                    $exceeded={item.exceeded}
                  >
                    <CardHeader>
                      <div>
                        <CategoryName>{item.budget.category}</CategoryName>
                        {item.exceeded && (
                          <ExceededBadge>Exceeded!</ExceededBadge>
                        )}
                      </div>
                      <CardActions>
                        <IconButton
                          $variant="edit"
                          type="button"
                          onClick={() => handleEdit(item)}
                          aria-label={`Edit ${item.budget.category} budget`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          $variant="delete"
                          type="button"
                          onClick={() =>
                            handleDeletePrompt(item.budget.id)
                          }
                          aria-label={`Delete ${item.budget.category} budget`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </IconButton>
                      </CardActions>
                    </CardHeader>

                    <ProgressTrack>
                      <ProgressFill $width={pct} $exceeded={item.exceeded} />
                    </ProgressTrack>

                    <AmountRow>
                      <SpentAmount $exceeded={item.exceeded}>
                        {formatCurrency(item.spent)}
                      </SpentAmount>
                      <LimitAmount>
                        / {formatCurrency(item.budget.limit)}
                      </LimitAmount>
                    </AmountRow>
                    <RemainingText $exceeded={item.exceeded}>
                      {item.exceeded
                        ? `Over by ${formatCurrency(Math.abs(item.remaining))}`
                        : `${formatCurrency(item.remaining)} remaining`}
                    </RemainingText>
                  </BudgetCard>
                );
              })}
            </BudgetGrid>
          </>
        )}
      </PageWrapper>

      {/* Add / Edit Modal */}
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

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        title="Delete Budget"
        size="sm"
      >
        <ConfirmBody>
          <ConfirmText>
            Are you sure you want to delete this budget? Historical spending
            data will not be affected.
          </ConfirmText>
          <ConfirmActions>
            <ConfirmButton
              $variant="cancel"
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTargetId(null);
              }}
              disabled={submitting}
            >
              Cancel
            </ConfirmButton>
            <ConfirmButton
              $variant="danger"
              type="button"
              onClick={handleDeleteConfirm}
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </ConfirmButton>
          </ConfirmActions>
        </ConfirmBody>
      </Modal>
    </>
  );
}
