"use client";

import ReactSelect from "react-select";
import Modal from "@/couple/_components/shared/Modal";
import {
  FormGroup,
  Label,
  ModalInput,
  ModalActions,
  SmallButton,
  ErrorText,
} from "../_styled";
import { SelectOption, accountTypeOptions, selectStyles } from "../_utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  editName: string;
  setEditName: (v: string) => void;
  editNickname: string;
  setEditNickname: (v: string) => void;
  editType: string;
  setEditType: (v: string) => void;
  editError: string;
  onSave: () => void;
};

export default function EditAccountModal({
  isOpen,
  onClose,
  saving,
  editName,
  setEditName,
  editNickname,
  setEditNickname,
  editType,
  setEditType,
  editError,
  onSave,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Account" size="sm">
      <FormGroup>
        <Label>Account Name</Label>
        <ModalInput
          placeholder="e.g. HDFC Savings"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />
      </FormGroup>
      <FormGroup>
        <Label>Nickname (optional)</Label>
        <ModalInput
          placeholder="e.g. Main, Joint"
          value={editNickname}
          onChange={(e) => setEditNickname(e.target.value)}
          maxLength={50}
        />
      </FormGroup>
      <FormGroup>
        <Label>Account Type</Label>
        <ReactSelect<SelectOption>
          options={accountTypeOptions}
          value={accountTypeOptions.find((o) => o.value === editType)}
          onChange={(opt) => setEditType(opt?.value ?? "SAVINGS_ACCOUNT")}
          styles={selectStyles}
          isSearchable={false}
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          menuPosition="fixed"
        />
      </FormGroup>
      {editError && <ErrorText>{editError}</ErrorText>}
      <ModalActions>
        <SmallButton onClick={onClose}>Cancel</SmallButton>
        <SmallButton
          $variant="primary"
          disabled={saving || !editName.trim()}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save"}
        </SmallButton>
      </ModalActions>
    </Modal>
  );
}
