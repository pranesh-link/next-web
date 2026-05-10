"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
} from "@/couple/finance/_actions/goals";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import GoalForm from "@/couple/_components/forms/GoalForm";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

import type { Goal, Notification } from "./_utils";
import { formatCurrency } from "./_utils";
import {
  PageWrapper,
  GoalsGrid,
  NotificationBanner,
  ErrorBanner,
} from "./_styled";
import GoalsSummarySection from "./_components/GoalsSummarySection";
import GoalCardItem from "./_components/GoalCardItem";
import ContributeModal from "./_components/ContributeModal";
import DeleteConfirmModal from "./_components/DeleteConfirmModal";
import { NOTIFICATION_TIMINGS } from "@/couple/_constants/animation";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Goal | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

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

  const fetchGoals = useCallback(async () => {
    const result = await getGoals();
    if (result.success) {
      setGoals(result.data as unknown as Goal[]);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await fetchGoals();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load goals");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchGoals]);

  const totalGoals = goals.length;
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  function handleOpenAdd() {
    setEditTarget(null);
    setShowModal(true);
  }

  function handleEdit(goal: Goal) {
    setEditTarget(goal);
    setShowModal(true);
  }

  function handleDeletePrompt(id: string) {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const result = await deleteGoal(deleteTargetId);
    setSubmitting(false);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (result.success) {
      notify("Goal deleted", "success");
      await fetchGoals();
    } else {
      notify(result.error, "error");
    }
  }

  async function handleFormSubmit(data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
  }) {
    setSubmitting(true);

    const result = editTarget
      ? await updateGoal(editTarget.id, data)
      : await createGoal(data);

    setSubmitting(false);

    if (result.success) {
      notify(editTarget ? "Goal updated" : "Goal created", "success");
      setShowModal(false);
      setEditTarget(null);
      await fetchGoals();
    } else {
      notify(result.error, "error");
    }
  }

  async function handleContribute() {
    if (!contributeGoal || !contributeAmount) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSubmitting(true);
    const result = await contributeToGoal(contributeGoal.id, amount);
    setSubmitting(false);

    if (result.success) {
      notify(
        `Contributed ${formatCurrency(amount)} to ${contributeGoal.name}`,
        "success",
      );
      setContributeGoal(null);
      setContributeAmount("");
      await fetchGoals();
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
        title="Savings Goals"
        action={{ label: "New Goal", onClick: handleOpenAdd }}
        onRefresh={fetchGoals}
      />

      <PageWrapper>
        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : error ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : goals.length === 0 ? (
          <EmptyState
            title="No savings goals yet"
            description="Set your first savings goal and start tracking your progress toward financial freedom."
            action={{ label: "New Goal", onClick: handleOpenAdd }}
          />
        ) : (
          <>
            <GoalsSummarySection
              totalGoals={totalGoals}
              totalSaved={totalSaved}
              totalTarget={totalTarget}
            />

            <GoalsGrid>
              {goals.map((goal) => (
                <GoalCardItem
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDeletePrompt={handleDeletePrompt}
                  onContribute={(g) => {
                    setContributeGoal(g);
                    setContributeAmount("");
                  }}
                />
              ))}
            </GoalsGrid>
          </>
        )}
      </PageWrapper>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTarget(null);
        }}
        title={editTarget ? "Edit Goal" : "New Goal"}
        size="md"
      >
        <GoalForm
          initialData={
            editTarget
              ? {
                  name: editTarget.name,
                  targetAmount: editTarget.targetAmount,
                  currentAmount: editTarget.currentAmount,
                  deadline: editTarget.deadline
                    ? typeof editTarget.deadline === "string"
                      ? editTarget.deadline.split("T")[0]
                      : new Date(editTarget.deadline)
                          .toISOString()
                          .split("T")[0]
                    : undefined,
                }
              : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          isLoading={submitting}
        />
      </Modal>

      <ContributeModal
        goal={contributeGoal}
        amount={contributeAmount}
        submitting={submitting}
        onAmountChange={setContributeAmount}
        onClose={() => {
          setContributeGoal(null);
          setContributeAmount("");
        }}
        onContribute={handleContribute}
      />

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
