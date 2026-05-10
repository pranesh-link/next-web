"use client";

import styled from "styled-components";
import {
  SectionTitle,
  InviteForm,
  InviteInputGroup,
  Label,
  Input,
  NoWrapPrimaryButton,
  ErrorText,
  Divider,
  InviteRow,
  InviteEmail,
  InviteStatus,
  CancelButton,
} from "../_styled";
import type { CoupleInvite, Notify } from "../_types";
import { buildInviteLink } from "../_utils";

/** Row container for the action buttons next to a pending invite. */
const InviteActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

type Props = {
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  onSendInvite: () => void;
  saving: boolean;
  error: string;
  invites: CoupleInvite[];
  cancellingId: string | null;
  onCancelInvite: (inviteId: string) => void;
  notify: Notify;
};

export default function InviteSection({
  inviteEmail,
  onInviteEmailChange,
  onSendInvite,
  saving,
  error,
  invites,
  cancellingId,
  onCancelInvite,
  notify,
}: Props) {
  return (
    <>
      <SectionTitle>Invite Your Partner</SectionTitle>
      <InviteForm>
        <InviteInputGroup>
          <Label>Partner&apos;s Email</Label>
          <Input
            type="email"
            placeholder="partner@email.com"
            value={inviteEmail}
            onChange={(e) => onInviteEmailChange(e.target.value)}
          />
        </InviteInputGroup>
        <NoWrapPrimaryButton
          type="button"
          disabled={saving || !inviteEmail.trim()}
          onClick={onSendInvite}
        >
          {saving ? "Creating…" : "Create Invite"}
        </NoWrapPrimaryButton>
      </InviteForm>
      {error && <ErrorText>{error}</ErrorText>}

      {invites && invites.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Pending Invites</SectionTitle>
          {invites.map((invite) => (
            <InviteRow key={invite.id}>
              <InviteEmail>{invite.email}</InviteEmail>
              <InviteActions>
                <InviteStatus>Pending</InviteStatus>
                <CancelButton
                  type="button"
                  $tone="info"
                  onClick={() => {
                    const link = buildInviteLink(invite);
                    navigator.clipboard.writeText(link);
                    notify("Invite link copied!", "success");
                  }}
                >
                  Copy Link
                </CancelButton>
                <CancelButton
                  type="button"
                  disabled={cancellingId === invite.id}
                  onClick={() => onCancelInvite(invite.id)}
                >
                  {cancellingId === invite.id ? "Cancelling…" : "Cancel"}
                </CancelButton>
              </InviteActions>
            </InviteRow>
          ))}
        </>
      )}
    </>
  );
}
