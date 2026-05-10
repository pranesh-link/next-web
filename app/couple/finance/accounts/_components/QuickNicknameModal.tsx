"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  FormGroup,
  Label,
  ModalInput,
  ModalActions,
  ModalButton,
} from "../_styled";

type Props = {
  targetName: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  value: string;
  setValue: (v: string) => void;
  onSave: () => void;
};

export default function QuickNicknameModal({
  targetName,
  isOpen,
  onClose,
  saving,
  value,
  setValue,
  onSave,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nickname · ${targetName || ""}`}
      size="sm"
    >
      <FormGroup>
        <Label>Nickname</Label>
        <ModalInput
          placeholder="e.g. Main, Joint"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={50}
        />
      </FormGroup>
      <ModalActions>
        <ModalButton onClick={onClose}>Cancel</ModalButton>
        <ModalButton $primary disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "Save"}
        </ModalButton>
      </ModalActions>
    </Modal>
  );
}
