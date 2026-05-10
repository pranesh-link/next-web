"use client";

import ReactSelect from "react-select";
import Modal from "@/couple/_components/shared/Modal";
import {
  FormGroup,
  Label,
  TypeDisplay,
  ModalInput,
  ModalActions,
  ModalButton,
  ErrorText,
  CheckboxRow,
  CheckboxLabel,
  WarningAlert,
} from "../_styled";
import {
  Account,
  CoupleUser,
  SelectOption,
  accountTypeOptions,
  selectStyles,
} from "../_utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  coupleUsers: CoupleUser[];
  currentUserId: string;
  existingSalaryAccount: Account | undefined;
  emergencyFundCount: number;
  newName: string;
  setNewName: (v: string) => void;
  newNickname: string;
  setNewNickname: (v: string) => void;
  newType: string;
  setNewType: (v: string) => void;
  newBalance: string;
  setNewBalance: (v: string) => void;
  newIsSalary: boolean;
  setNewIsSalary: (v: boolean) => void;
  newIsEmergency: boolean;
  setNewIsEmergency: (v: boolean) => void;
  newOwnerId: string;
  setNewOwnerId: (v: string) => void;
  createError: string;
  onCreate: () => void;
};

export default function CreateAccountModal({
  isOpen,
  onClose,
  saving,
  coupleUsers,
  currentUserId,
  existingSalaryAccount,
  emergencyFundCount,
  newName,
  setNewName,
  newNickname,
  setNewNickname,
  newType,
  setNewType,
  newBalance,
  setNewBalance,
  newIsSalary,
  setNewIsSalary,
  newIsEmergency,
  setNewIsEmergency,
  newOwnerId,
  setNewOwnerId,
  createError,
  onCreate,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Account" size="sm">
      <FormGroup>
        <Label>Account Name</Label>
        <ModalInput
          placeholder="e.g. HDFC Savings"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </FormGroup>
      <FormGroup>
        <Label>Nickname (optional)</Label>
        <ModalInput
          placeholder="e.g. Main, Joint"
          value={newNickname}
          onChange={(e) => setNewNickname(e.target.value)}
          maxLength={50}
        />
      </FormGroup>
      <FormGroup>
        <Label>Account Type</Label>
        {accountTypeOptions.length === 1 ? (
          <TypeDisplay>{accountTypeOptions[0].label}</TypeDisplay>
        ) : (
          <ReactSelect<SelectOption>
            options={accountTypeOptions}
            value={accountTypeOptions.find((o) => o.value === newType)}
            onChange={(opt) => setNewType(opt?.value ?? "SAVINGS_ACCOUNT")}
            styles={selectStyles}
            isSearchable={false}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
          />
        )}
      </FormGroup>
      {coupleUsers.length > 1 && (
        <FormGroup>
          <Label>Account belongs to</Label>
          <ReactSelect<SelectOption>
            options={coupleUsers.map((u) => ({
              value: u.id,
              label: u.id === currentUserId ? `${u.name || u.email} (You)` : (u.name || u.email),
            }))}
            value={coupleUsers.map((u) => ({
              value: u.id,
              label: u.id === currentUserId ? `${u.name || u.email} (You)` : (u.name || u.email),
            })).find((o) => o.value === newOwnerId)}
            onChange={(opt) => setNewOwnerId(opt?.value ?? currentUserId)}
            styles={selectStyles}
            isSearchable={false}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
          />
        </FormGroup>
      )}
      <FormGroup>
        <Label>Opening Balance</Label>
        <ModalInput
          type="number"
          placeholder="0"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
        />
      </FormGroup>
      <CheckboxRow>
        <input
          type="checkbox"
          id="isSalary"
          checked={newIsSalary}
          onChange={(e) => setNewIsSalary(e.target.checked)}
        />
        <CheckboxLabel htmlFor="isSalary">Set as salary account?</CheckboxLabel>
      </CheckboxRow>
      {newIsSalary && existingSalaryAccount && (
        <WarningAlert>
          ⚠️ <strong>{existingSalaryAccount.name}</strong> is currently your salary account. Creating this as salary account will replace it.
        </WarningAlert>
      )}
      <CheckboxRow>
        <input
          type="checkbox"
          id="isEmergency"
          checked={newIsEmergency}
          onChange={(e) => setNewIsEmergency(e.target.checked)}
          disabled={emergencyFundCount >= 2}
        />
        <CheckboxLabel htmlFor="isEmergency">Tag as emergency fund?</CheckboxLabel>
      </CheckboxRow>
      {emergencyFundCount >= 2 && (
        <WarningAlert>
          ⚠️ Maximum 2 emergency fund accounts already tagged.
        </WarningAlert>
      )}
      {createError && <ErrorText>{createError}</ErrorText>}
      <ModalActions>
        <ModalButton onClick={onClose}>Cancel</ModalButton>
        <ModalButton
          $primary
          disabled={saving || !newName.trim() || (coupleUsers.length > 1 && !newOwnerId)}
          onClick={onCreate}
        >
          {saving ? "Creating…" : "Create"}
        </ModalButton>
      </ModalActions>
    </Modal>
  );
}
