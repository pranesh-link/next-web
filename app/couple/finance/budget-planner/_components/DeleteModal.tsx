"use client";

import Modal from "@/couple/_components/shared/Modal";
import { ConfirmBody, ConfirmText, ConfirmActions, ConfirmButton } from "../_styled";
import { formatMonthLabel } from "../_utils";

type Props = {
  isOpen: boolean;
  mode: "monthly" | "yearly";
  monthAndYear: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteModal({
  isOpen,
  mode,
  monthAndYear,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Budget Plan?">
      <ConfirmBody>
        <ConfirmText>
          This will permanently delete your budget plan for{" "}
          {mode === "monthly" ? formatMonthLabel(monthAndYear) : monthAndYear}. This
          action cannot be undone.
        </ConfirmText>
        <ConfirmActions>
          <ConfirmButton $variant="cancel" onClick={onClose}>
            Cancel
          </ConfirmButton>
          <ConfirmButton $variant="danger" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Deleting…" : "Delete"}
          </ConfirmButton>
        </ConfirmActions>
      </ConfirmBody>
    </Modal>
  );
}
