"use client";

import styled from "styled-components";
import { EASING } from "../_utils";

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

type Props = {
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirm({ submitting, onCancel, onConfirm }: Props) {
  return (
    <ConfirmBody>
      <ConfirmText>
        Are you sure you want to delete this loan? This action cannot be
        undone.
      </ConfirmText>
      <ConfirmActions>
        <ConfirmButton
          $variant="cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </ConfirmButton>
        <ConfirmButton
          $variant="danger"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? "Deleting…" : "Delete"}
        </ConfirmButton>
      </ConfirmActions>
    </ConfirmBody>
  );
}
