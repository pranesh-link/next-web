"use client";

import {
  CoupleCard,
  DangerOutlineButton,
  Divider,
  LeaveSection,
} from "../_styled";
import type { CoupleMember, CoupleInvite, Notify } from "../_types";
import RenameableTitle from "./RenameableTitle";
import MembersList from "./MembersList";
import InviteSection from "./InviteSection";

type Props = {
  title: string;
  isRenaming: boolean;
  newCoupleName: string;
  onNewCoupleNameChange: (value: string) => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onCancelRename: () => void;
  saving: boolean;
  members: CoupleMember[];
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  onSendInvite: () => void;
  error: string;
  invites: CoupleInvite[];
  cancellingId: string | null;
  onCancelInvite: (inviteId: string) => void;
  notify: Notify;
  onShowDisband: () => void;
};

export default function PartnerInviteCard({
  title,
  isRenaming,
  newCoupleName,
  onNewCoupleNameChange,
  onStartRename,
  onSubmitRename,
  onCancelRename,
  saving,
  members,
  inviteEmail,
  onInviteEmailChange,
  onSendInvite,
  error,
  invites,
  cancellingId,
  onCancelInvite,
  notify,
  onShowDisband,
}: Props) {
  return (
    <CoupleCard>
      <RenameableTitle
        title={title}
        isRenaming={isRenaming}
        newName={newCoupleName}
        saving={saving}
        onNewNameChange={onNewCoupleNameChange}
        onStartRename={onStartRename}
        onSubmitRename={onSubmitRename}
        onCancelRename={onCancelRename}
      />

      <Divider />

      <MembersList members={members} />

      <Divider />

      <InviteSection
        inviteEmail={inviteEmail}
        onInviteEmailChange={onInviteEmailChange}
        onSendInvite={onSendInvite}
        saving={saving}
        error={error}
        invites={invites}
        cancellingId={cancellingId}
        onCancelInvite={onCancelInvite}
        notify={notify}
      />

      <LeaveSection>
        <DangerOutlineButton type="button" onClick={onShowDisband}>
          Disband Group
        </DangerOutlineButton>
      </LeaveSection>
    </CoupleCard>
  );
}
