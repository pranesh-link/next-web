"use client";

import {
  GoalCard,
  GoalCardHeader,
  GoalName,
  CardActions,
  IconButton,
  RingContainer,
  RingWrapper,
  RingSvg,
  RingTrack,
  RingFill,
  RingCenter,
  RingPct,
  RingLabel,
  AmountRow,
  CurrentAmount,
  TargetAmount,
  RemainingText,
  DeadlineRow,
  DeadlineBadge,
  ButtonRow,
  SmallButton,
} from "../_styled";
import {
  type Goal,
  formatCurrency,
  getMonthsLeft,
  RING_RADIUS,
  RING_CIRCUMFERENCE,
} from "../_utils";

type Props = {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDeletePrompt: (id: string) => void;
  onContribute: (goal: Goal) => void;
};

export default function GoalCardItem({
  goal,
  onEdit,
  onDeletePrompt,
  onContribute,
}: Props) {
  const pct =
    goal.targetAmount > 0
      ? Math.min(
          Math.round((goal.currentAmount / goal.targetAmount) * 100),
          100,
        )
      : 0;
  const nearComplete = pct >= 90;
  const remaining = goal.targetAmount - goal.currentAmount;
  const dashoffset =
    RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

  const hasDeadline = !!goal.deadline;
  const monthsLeft = hasDeadline ? getMonthsLeft(goal.deadline!) : null;
  const isOverdue = monthsLeft !== null && monthsLeft < 0 && pct < 100;

  return (
    <GoalCard $nearComplete={nearComplete}>
      <GoalCardHeader>
        <GoalName>{goal.name}</GoalName>
        <CardActions>
          <IconButton
            $variant="edit"
            onClick={() => onEdit(goal)}
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
            onClick={() => onDeletePrompt(goal.id)}
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
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <RingTrack cx="60" cy="60" r={RING_RADIUS} />
            <RingFill
              cx="60"
              cy="60"
              r={RING_RADIUS}
              $dashoffset={dashoffset}
              $circumference={RING_CIRCUMFERENCE}
              $gradientId={`goalGradient-${goal.id}`}
            />
          </RingSvg>
          <RingCenter>
            <RingPct>{pct}%</RingPct>
            <RingLabel>saved</RingLabel>
          </RingCenter>
        </RingWrapper>
      </RingContainer>

      <AmountRow>
        <CurrentAmount>{formatCurrency(goal.currentAmount)}</CurrentAmount>
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

      <ButtonRow>
        {remaining > 0 && (
          <SmallButton $variant="accent" onClick={() => onContribute(goal)}>
            + Contribute
          </SmallButton>
        )}
        <SmallButton $variant="outline" onClick={() => onEdit(goal)}>
          Edit
        </SmallButton>
        <SmallButton
          $variant="outline"
          onClick={() => onDeletePrompt(goal.id)}
        >
          Delete
        </SmallButton>
      </ButtonRow>
    </GoalCard>
  );
}
