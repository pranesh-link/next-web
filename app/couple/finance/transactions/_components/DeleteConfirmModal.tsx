"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  ConfirmActions,
  ConfirmBody,
  ConfirmButton,
  ConfirmText,
} from "../_styled";

type Props = {
  isOpen: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  isOpen,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Transaction" size="sm">
      <ConfirmBody>
        <ConfirmText>
          Are you sure you want to delete this transaction? This action cannot
          be undone and the account balance will be adjusted accordingly.
        </ConfirmText>
        <ConfirmActions>
          <ConfirmButton
            $variant="cancel"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </ConfirmButton>
          <ConfirmButton
            $variant="danger"
            type="button"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Deleting…" : "Delete"}
          </ConfirmButton>
        </ConfirmActions>
      </ConfirmBody>
    </Modal>
  );
}
