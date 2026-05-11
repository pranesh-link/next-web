"use client";

import Modal from "@/couple/_components/shared/Modal";
import { ConfirmBody, ConfirmText, ConfirmActions, ConfirmButton } from "../_styled";
import { DELETE_MODAL_TITLE, DELETE_MODAL_BODY_PREFIX, DELETE_MODAL_BODY_SUFFIX, CANCEL, DELETING, DELETE } from "../_labels";
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
    <Modal isOpen={isOpen} onClose={onClose} title={DELETE_MODAL_TITLE}>
      <ConfirmBody>
        <ConfirmText>
          {DELETE_MODAL_BODY_PREFIX}{" "}
          {mode === "monthly" ? formatMonthLabel(monthAndYear) : monthAndYear}.{" "}
          {DELETE_MODAL_BODY_SUFFIX}
        </ConfirmText>
        <ConfirmActions>
          <ConfirmButton $variant="cancel" onClick={onClose}>
            {CANCEL}
          </ConfirmButton>
          <ConfirmButton $variant="danger" onClick={onConfirm} disabled={submitting}>
            {submitting ? DELETING : DELETE}
          </ConfirmButton>
        </ConfirmActions>
      </ConfirmBody>
    </Modal>
  );
}
