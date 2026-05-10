"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  ConfirmBody,
  ConfirmText,
  ConfirmActions,
  ConfirmButton,
} from "../_styled";

type Props = {
  isOpen: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  isOpen,
  submitting,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete Budget" size="sm">
      <ConfirmBody>
        <ConfirmText>
          Are you sure you want to delete this budget? Historical spending
          data will not be affected.
        </ConfirmText>
        <ConfirmActions>
          <ConfirmButton
            $variant="cancel"
            type="button"
            onClick={onCancel}
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
