"use client";

import styled from "styled-components";
import { SAVING, SAVE_PLAN, RESET, DELETE_PLAN } from "../_labels";
import { EASING } from "../_utils";

const ActionBar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  padding: 12px 28px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

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

const OutlineButton = styled.button`
  padding: 12px 28px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
  }
`;

const DangerButton = styled.button`
  padding: 12px 28px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

type Props = {
  submitting: boolean;
  hasSavedPlan: boolean;
  onSave: () => void;
  onReset: () => void;
  onDelete: () => void;
};

export default function ActionButtonsBar({
  submitting,
  hasSavedPlan,
  onSave,
  onReset,
  onDelete,
}: Props) {
  return (
    <ActionBar>
      <PrimaryButton onClick={onSave} disabled={submitting}>
        {submitting ? SAVING : SAVE_PLAN}
      </PrimaryButton>
      <OutlineButton onClick={onReset}>{RESET}</OutlineButton>
      {hasSavedPlan && (
        <DangerButton onClick={onDelete} disabled={submitting}>
          {DELETE_PLAN}
        </DangerButton>
      )}
    </ActionBar>
  );
}
