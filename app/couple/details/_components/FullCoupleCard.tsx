"use client";

import { CoupleCard, DangerOutlineButton, LeaveSection } from "../_styled";
import type { CoupleMember } from "../_types";
import RenameableTitle from "./RenameableTitle";
import MembersList from "./MembersList";

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
  onShowDisband: () => void;
};

export default function FullCoupleCard({
  title,
  isRenaming,
  newCoupleName,
  onNewCoupleNameChange,
  onStartRename,
  onSubmitRename,
  onCancelRename,
  saving,
  members,
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

      <MembersList members={members} />

      <LeaveSection>
        <DangerOutlineButton type="button" onClick={onShowDisband}>
          Disband Group
        </DangerOutlineButton>
      </LeaveSection>
    </CoupleCard>
  );
}
