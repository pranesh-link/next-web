"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  ConfirmText,
  ButtonRow,
  OutlineButton,
  DangerButton,
} from "../_styled";

type Props = {
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DisbandConfirmModal({
  isOpen,
  saving,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disband Group" size="sm">
      <ConfirmText>
        Are you sure? This will permanently delete the group. Both members will
        lose couple data sharing and can create new groups independently.
      </ConfirmText>
      <ButtonRow>
        <OutlineButton type="button" onClick={onClose} disabled={saving}>
          Cancel
        </OutlineButton>
        <DangerButton type="button" onClick={onConfirm} disabled={saving}>
          {saving ? "Disbanding…" : "Disband"}
        </DangerButton>
      </ButtonRow>
    </Modal>
  );
}
