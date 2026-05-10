"use client";

import styled from "styled-components";
import { DangerZone, DangerText, SmallButton } from "../_styled";

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
`;

type Props = {
  confirmDelete: boolean;
  saving: boolean;
  onCancel: () => void;
  onAskConfirm: () => void;
  onDelete: () => void;
};

export default function DeleteSection({
  confirmDelete,
  saving,
  onCancel,
  onAskConfirm,
  onDelete,
}: Props) {
  return (
    <DangerZone>
      <DangerText>
        Permanently delete this account and all its balance history.
      </DangerText>
      {confirmDelete ? (
        <ConfirmActions>
          <SmallButton onClick={onCancel}>Cancel</SmallButton>
          <SmallButton $variant="danger" disabled={saving} onClick={onDelete}>
            {saving ? "Deleting…" : "Confirm Delete"}
          </SmallButton>
        </ConfirmActions>
      ) : (
        <SmallButton $variant="danger" onClick={onAskConfirm}>
          Delete Account
        </SmallButton>
      )}
    </DangerZone>
  );
}
