"use client";

import Modal from "@/couple/_components/shared/Modal";
import {
  FormGroup,
  Label,
  ModalInput,
  ModalActions,
  SmallButton,
} from "../_styled";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  newBalance: string;
  setNewBalance: (v: string) => void;
  balanceNote: string;
  setBalanceNote: (v: string) => void;
  onSave: () => void;
};

export default function UpdateBalanceModal({
  isOpen,
  onClose,
  saving,
  newBalance,
  setNewBalance,
  balanceNote,
  setBalanceNote,
  onSave,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Balance"
      size="sm"
    >
      <FormGroup>
        <Label>New Balance</Label>
        <ModalInput
          type="number"
          placeholder="Enter new balance"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
        />
      </FormGroup>
      <FormGroup>
        <Label>Note (optional)</Label>
        <ModalInput
          type="text"
          placeholder="e.g. Salary credited"
          value={balanceNote}
          onChange={(e) => setBalanceNote(e.target.value)}
        />
      </FormGroup>
      <ModalActions>
        <SmallButton onClick={onClose}>Cancel</SmallButton>
        <SmallButton
          $variant="primary"
          disabled={saving || !newBalance}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Update"}
        </SmallButton>
      </ModalActions>
    </Modal>
  );
}
