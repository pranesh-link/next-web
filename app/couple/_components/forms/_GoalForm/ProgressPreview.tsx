"use client";

import {
  ProgressBox,
  ProgressFill,
  ProgressHeader,
  ProgressLabel,
  ProgressPct,
  ProgressTrack,
  RemainingText,
} from "../GoalForm.styled";

/**
 * Props for {@link ProgressPreview}.
 */
export interface ProgressPreviewProps {
  /** Target amount in INR (must be > 0 for the preview to render meaningfully). */
  targetAmount: number;
  /** Current saved amount in INR. */
  currentAmount: number;
}

/**
 * Render a live progress preview card showing percentage saved and remaining amount.
 *
 * @param props - See {@link ProgressPreviewProps}.
 * @returns A styled card with a progress bar and remaining-amount label.
 */
export default function ProgressPreview({
  targetAmount,
  currentAmount,
}: ProgressPreviewProps) {
  const percentage =
    targetAmount > 0
      ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
      : 0;

  return (
    <ProgressBox>
      <ProgressHeader>
        <ProgressLabel>Progress</ProgressLabel>
        <ProgressPct>{percentage}%</ProgressPct>
      </ProgressHeader>
      <ProgressTrack>
        <ProgressFill $pct={percentage} />
      </ProgressTrack>
      <RemainingText>
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(targetAmount - currentAmount)}{" "}
        remaining
      </RemainingText>
    </ProgressBox>
  );
}
