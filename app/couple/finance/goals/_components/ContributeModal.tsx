"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  ContributeWrapper,
  ContributeProgress,
  ContributeRow,
  ContributeLabel,
  ContributeValue,
  ContributeTrack,
  ContributeFill,
  NewProgressLabel,
  NewPctText,
  DarkInput,
  ContributeActions,
  ContributeButton,
} from "../_styled";
import { type Goal, formatCurrency } from "../_utils";

type Props = {
  goal: Goal | null;
  amount: string;
  submitting: boolean;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onContribute: () => void;
};

export default function ContributeModal({
  goal,
  amount,
  submitting,
  onAmountChange,
  onClose,
  onContribute,
}: Props) {
  return (
    <Modal
      isOpen={!!goal}
      onClose={onClose}
      title={`Contribute to ${goal?.name ?? ""}`}
      size="sm"
    >
      {goal && (
        <ContributeWrapper>
          <ContributeProgress>
            <ContributeRow>
              <ContributeLabel>Current</ContributeLabel>
              <ContributeValue>
                {formatCurrency(goal.currentAmount)}
              </ContributeValue>
            </ContributeRow>
            <ContributeRow>
              <ContributeLabel>Target</ContributeLabel>
              <ContributeValue $color="var(--accent-light)">
                {formatCurrency(goal.targetAmount)}
              </ContributeValue>
            </ContributeRow>
            <ContributeTrack>
              <ContributeFill
                $width={
                  goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0
                }
              />
            </ContributeTrack>

            {amount && parseFloat(amount) > 0 && (
              <>
                <NewProgressLabel>
                  <NewPctText>After contribution →</NewPctText>
                  <NewPctText $color="var(--success)">
                    {Math.min(
                      Math.round(
                        ((goal.currentAmount + parseFloat(amount)) /
                          goal.targetAmount) *
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
                      ((goal.currentAmount + parseFloat(amount)) /
                        goal.targetAmount) *
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
            max={goal.targetAmount - goal.currentAmount}
            placeholder="Enter contribution amount"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />

          <ContributeActions>
            <ContributeButton
              $variant="cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </ContributeButton>
            <ContributeButton
              $variant="primary"
              onClick={onContribute}
              disabled={submitting || !amount}
            >
              {submitting
                ? "Adding…"
                : `Contribute ${amount ? formatCurrency(parseFloat(amount) || 0) : ""}`}
            </ContributeButton>
          </ContributeActions>
        </ContributeWrapper>
      )}
    </Modal>
  );
}
