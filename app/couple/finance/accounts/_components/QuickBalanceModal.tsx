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
  note: string;
  setNote: (v: string) => void;
  onSave: () => void;
};

export default function QuickBalanceModal({
  targetName,
  isOpen,
  onClose,
  saving,
  value,
  setValue,
  note,
  setNote,
  onSave,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Balance · ${targetName || ""}`}
      size="sm"
    >
      <FormGroup>
        <Label>New Balance</Label>
        <ModalInput
          type="number"
          placeholder="Enter new balance"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </FormGroup>
      <FormGroup>
        <Label>Note (optional)</Label>
        <ModalInput
          placeholder="e.g. Salary credited"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormGroup>
      <ModalActions>
        <ModalButton onClick={onClose}>Cancel</ModalButton>
        <ModalButton $primary disabled={saving || !value} onClick={onSave}>
          {saving ? "Saving…" : "Update"}
        </ModalButton>
      </ModalActions>
    </Modal>
  );
}
