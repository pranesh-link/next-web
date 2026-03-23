"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
} from "@/finance/_actions/goals";
import FinanceHeader from "@/finance/_components/layout/FinanceHeader";
import GoalForm from "@/finance/_components/forms/GoalForm";
import Modal from "@/finance/_components/shared/Modal";
import EmptyState from "@/finance/_components/shared/EmptyState";
import LoadingSkeleton from "@/finance/_components/shared/LoadingSkeleton";

/* ── Types ──────────────────────────────────────────── */

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Notification = {
  message: string;
  type: "success" | "error";
};

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Helpers ────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMonthsLeft(deadline: string | Date): number {
  const target = new Date(deadline);
  const now = new Date();
  const diff =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return diff;
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const ringDraw = keyframes`
  from { stroke-dashoffset: var(--ring-circumference); }
`;

const sparkle = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.2), inset 0 0 12px rgba(34, 197, 94, 0.05); }
  50% { box-shadow: 0 0 24px rgba(34, 197, 94, 0.35), inset 0 0 20px rgba(34, 197, 94, 0.08); }
`;

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
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

const SummaryCardStyled = styled.div`
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

/* ── Goals Grid ── */

const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const GoalCard = styled.div<{ $nearComplete: boolean }>`
  background: var(--surface);
  border: 1px solid
    ${(p) =>
      p.$nearComplete ? "rgba(34, 197, 94, 0.35)" : "var(--border)"};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ${EASING};

  ${(p) =>
    p.$nearComplete &&
    css`
      animation: ${sparkle} 3s ease-in-out infinite;
    `}

  &:hover {
    border-color: ${(p) =>
      p.$nearComplete
        ? "rgba(34, 197, 94, 0.5)"
        : "rgba(59, 130, 246, 0.3)"};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px
      ${(p) =>
        p.$nearComplete
          ? "rgba(34, 197, 94, 0.1)"
          : "rgba(59, 130, 246, 0.08)"};
  }
`;

const GoalCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const GoalName = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
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

/* ── Progress Ring ── */

const RingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
`;

const RingSvg = styled.svg`
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
`;

const RingTrack = styled.circle`
  fill: none;
  stroke: var(--surface-hover);
  stroke-width: 8;
`;

const RingFill = styled.circle<{ $dashoffset: number; $circumference: number }>`
  fill: none;
  stroke: url(#goalGradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: ${(p) => p.$circumference};
  stroke-dashoffset: ${(p) => p.$dashoffset};
  transition: stroke-dashoffset 1s ${EASING};
  --ring-circumference: ${(p) => p.$circumference};
  animation: ${ringDraw} 1s ${EASING};
`;

const RingCenter = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const RingPct = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1px;
`;

const RingLabel = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const RingWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ── Amounts ── */

const AmountRow = styled.div`
  text-align: center;
  margin-bottom: 8px;
`;

const CurrentAmount = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
`;

const TargetAmount = styled.span`
  font-size: 14px;
  color: var(--text-muted);
`;

const RemainingText = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  margin: 0 0 12px 0;
`;

/* ── Deadline ── */

const DeadlineBadge = styled.span<{ $overdue: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 16px;

  background: ${(p) =>
    p.$overdue
      ? "rgba(239, 68, 68, 0.12)"
      : "rgba(59, 130, 246, 0.1)"};
  color: ${(p) =>
    p.$overdue ? "var(--danger)" : "var(--accent-light)"};
  border: 1px solid
    ${(p) =>
      p.$overdue
        ? "rgba(239, 68, 68, 0.25)"
        : "rgba(59, 130, 246, 0.2)"};
`;

const DeadlineRow = styled.div`
  text-align: center;
`;

/* ── Action Buttons ── */

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

const SmallButton = styled.button<{
  $variant?: "primary" | "outline" | "accent";
}>`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  background: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(34, 197, 94, 0.1)"
        : "transparent"};
  color: ${(p) =>
    p.$variant === "primary"
      ? "#fff"
      : p.$variant === "accent"
        ? "var(--success)"
        : "var(--text-dim)"};
  border-color: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(34, 197, 94, 0.3)"
        : "var(--border)"};

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ── Contribute Modal ── */

const ContributeWrapper = styled.div`
  padding: 24px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const ContributeProgress = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
`;

const ContributeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: 8px;
  }
`;

const ContributeLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

const ContributeValue = styled.span<{ $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.$color ?? "var(--text)"};
`;

const ContributeTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--surface-hover);
  overflow: hidden;
  margin-top: 12px;
`;

const ContributeFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 6px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: linear-gradient(90deg, var(--accent), #22d3ee);
  transition: width 0.5s ${EASING};
`;

const NewProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const NewPctText = styled.span<{ $color?: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.$color ?? "var(--text-muted)"};
`;

const DarkInput = styled.input`
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  margin-bottom: 16px;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const ContributeActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ContributeButton = styled.button<{
  $variant: "primary" | "cancel";
}>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  border: 1px solid;

  background: ${(p) =>
    p.$variant === "primary" ? "var(--success)" : "transparent"};
  color: ${(p) =>
    p.$variant === "primary" ? "#fff" : "var(--text)"};
  border-color: ${(p) =>
    p.$variant === "primary" ? "var(--success)" : "var(--border)"};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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

const RING_RADIUS = 48;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Goal | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  /* Contribute */
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

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

  /* ── Summary computation ── */

  const totalGoals = goals.length;
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  /* ── Handlers ── */

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

  /* ── Contribute ── */

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

  /* ── Render ── */

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
            {/* Summary Row */}
            <SummaryRow>
              <SummaryCardStyled>
                <SummaryLabel>Total Goals</SummaryLabel>
                <SummaryValue>{totalGoals}</SummaryValue>
              </SummaryCardStyled>
              <SummaryCardStyled>
                <SummaryLabel>Total Saved</SummaryLabel>
                <SummaryValue $color="var(--success)">
                  {formatCurrency(totalSaved)}
                </SummaryValue>
              </SummaryCardStyled>
              <SummaryCardStyled>
                <SummaryLabel>Total Target</SummaryLabel>
                <SummaryValue $color="var(--accent-light)">
                  {formatCurrency(totalTarget)}
                </SummaryValue>
              </SummaryCardStyled>
            </SummaryRow>

            {/* Goals Grid */}
            <GoalsGrid>
              {goals.map((goal) => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.min(
                        Math.round(
                          (goal.currentAmount / goal.targetAmount) * 100,
                        ),
                        100,
                      )
                    : 0;
                const nearComplete = pct >= 90;
                const remaining = goal.targetAmount - goal.currentAmount;
                const dashoffset =
                  RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

                const hasDeadline = !!goal.deadline;
                const monthsLeft = hasDeadline
                  ? getMonthsLeft(goal.deadline!)
                  : null;
                const isOverdue =
                  monthsLeft !== null && monthsLeft < 0 && pct < 100;

                return (
                  <GoalCard key={goal.id} $nearComplete={nearComplete}>
                    {/* Header */}
                    <GoalCardHeader>
                      <GoalName>{goal.name}</GoalName>
                      <CardActions>
                        <IconButton
                          $variant="edit"
                          onClick={() => handleEdit(goal)}
                          aria-label="Edit goal"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          $variant="delete"
                          onClick={() => handleDeletePrompt(goal.id)}
                          aria-label="Delete goal"
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
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </IconButton>
                      </CardActions>
                    </GoalCardHeader>

                    {/* Progress Ring */}
                    <RingContainer>
                      <RingWrapper>
                        <RingSvg viewBox="0 0 120 120">
                          <defs>
                            <linearGradient
                              id={`goalGradient-${goal.id}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--accent)"
                              />
                              <stop
                                offset="100%"
                                stopColor="#22d3ee"
                              />
                            </linearGradient>
                          </defs>
                          <RingTrack cx="60" cy="60" r={RING_RADIUS} />
                          <RingFill
                            cx="60"
                            cy="60"
                            r={RING_RADIUS}
                            $dashoffset={dashoffset}
                            $circumference={RING_CIRCUMFERENCE}
                            style={{
                              stroke: `url(#goalGradient-${goal.id})`,
                            }}
                          />
                        </RingSvg>
                        <RingCenter>
                          <RingPct>{pct}%</RingPct>
                          <RingLabel>saved</RingLabel>
                        </RingCenter>
                      </RingWrapper>
                    </RingContainer>

                    {/* Amounts */}
                    <AmountRow>
                      <CurrentAmount>
                        {formatCurrency(goal.currentAmount)}
                      </CurrentAmount>
                      <TargetAmount>
                        {" "}
                        / {formatCurrency(goal.targetAmount)}
                      </TargetAmount>
                    </AmountRow>

                    <RemainingText>
                      {remaining > 0
                        ? `${formatCurrency(remaining)} remaining`
                        : "Goal reached!"}
                    </RemainingText>

                    {/* Deadline */}
                    {hasDeadline && (
                      <DeadlineRow>
                        <DeadlineBadge $overdue={isOverdue}>
                          {isOverdue
                            ? "Overdue"
                            : monthsLeft === 0
                              ? "Due this month"
                              : `${monthsLeft} month${monthsLeft !== 1 ? "s" : ""} left`}
                        </DeadlineBadge>
                      </DeadlineRow>
                    )}

                    {/* Action Buttons */}
                    <ButtonRow>
                      {remaining > 0 && (
                        <SmallButton
                          $variant="accent"
                          onClick={() => {
                            setContributeGoal(goal);
                            setContributeAmount("");
                          }}
                        >
                          + Contribute
                        </SmallButton>
                      )}
                      <SmallButton
                        $variant="outline"
                        onClick={() => handleEdit(goal)}
                      >
                        Edit
                      </SmallButton>
                      <SmallButton
                        $variant="outline"
                        onClick={() => handleDeletePrompt(goal.id)}
                      >
                        Delete
                      </SmallButton>
                    </ButtonRow>
                  </GoalCard>
                );
              })}
            </GoalsGrid>
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

      {/* Contribute Modal */}
      <Modal
        isOpen={!!contributeGoal}
        onClose={() => {
          setContributeGoal(null);
          setContributeAmount("");
        }}
        title={`Contribute to ${contributeGoal?.name ?? ""}`}
        size="sm"
      >
        {contributeGoal && (
          <ContributeWrapper>
            {/* Current progress */}
            <ContributeProgress>
              <ContributeRow>
                <ContributeLabel>Current</ContributeLabel>
                <ContributeValue>
                  {formatCurrency(contributeGoal.currentAmount)}
                </ContributeValue>
              </ContributeRow>
              <ContributeRow>
                <ContributeLabel>Target</ContributeLabel>
                <ContributeValue $color="var(--accent-light)">
                  {formatCurrency(contributeGoal.targetAmount)}
                </ContributeValue>
              </ContributeRow>
              <ContributeTrack>
                <ContributeFill
                  $width={
                    contributeGoal.targetAmount > 0
                      ? (contributeGoal.currentAmount /
                          contributeGoal.targetAmount) *
                        100
                      : 0
                  }
                />
              </ContributeTrack>

              {/* New progress preview */}
              {contributeAmount && parseFloat(contributeAmount) > 0 && (
                <>
                  <NewProgressLabel>
                    <NewPctText>
                      After contribution →
                    </NewPctText>
                    <NewPctText $color="var(--success)">
                      {Math.min(
                        Math.round(
                          ((contributeGoal.currentAmount +
                            parseFloat(contributeAmount)) /
                            contributeGoal.targetAmount) *
                            100,
                        ),
                        100,
                      )}
                      %
                    </NewPctText>
                  </NewProgressLabel>
                  <ContributeTrack>
                    <ContributeFill
                      $width={Math.min(
                        ((contributeGoal.currentAmount +
                          parseFloat(contributeAmount)) /
                          contributeGoal.targetAmount) *
                          100,
                        100,
                      )}
                    />
                  </ContributeTrack>
                </>
              )}
            </ContributeProgress>

            <DarkInput
              type="number"
              min="1"
              max={
                contributeGoal.targetAmount - contributeGoal.currentAmount
              }
              placeholder="Enter contribution amount"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
            />

            <ContributeActions>
              <ContributeButton
                $variant="cancel"
                onClick={() => {
                  setContributeGoal(null);
                  setContributeAmount("");
                }}
                disabled={submitting}
              >
                Cancel
              </ContributeButton>
              <ContributeButton
                $variant="primary"
                onClick={handleContribute}
                disabled={submitting || !contributeAmount}
              >
                {submitting
                  ? "Adding…"
                  : `Contribute ${contributeAmount ? formatCurrency(parseFloat(contributeAmount) || 0) : ""}`}
              </ContributeButton>
            </ContributeActions>
          </ContributeWrapper>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        title="Delete Goal"
        size="sm"
      >
        <ConfirmBody>
          <ConfirmText>
            Are you sure you want to delete this goal? This action cannot be
            undone.
          </ConfirmText>
          <ConfirmActions>
            <ConfirmButton
              $variant="cancel"
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
