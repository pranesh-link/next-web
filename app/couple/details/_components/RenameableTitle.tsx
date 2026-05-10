"use client";

import {
  TitleRow,
  CardTitle,
  EditButton,
  RenameRow,
  RenameInput,
  SmallButton,
} from "../_styled";

type Props = {
  title: string;
  isRenaming: boolean;
  newName: string;
  saving: boolean;
  onNewNameChange: (value: string) => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onCancelRename: () => void;
};

export default function RenameableTitle({
  title,
  isRenaming,
  newName,
  saving,
  onNewNameChange,
  onStartRename,
  onSubmitRename,
  onCancelRename,
}: Props) {
  if (isRenaming) {
    return (
      <RenameRow>
        <RenameInput
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitRename();
            if (e.key === "Escape") onCancelRename();
          }}
        />
        <SmallButton
          $variant="primary"
          onClick={onSubmitRename}
          disabled={saving}
        >
          Save
        </SmallButton>
        <SmallButton
          $variant="ghost"
          onClick={onCancelRename}
          disabled={saving}
        >
          Cancel
        </SmallButton>
      </RenameRow>
    );
  }

  return (
    <TitleRow>
      <CardTitle>{title}</CardTitle>
      <EditButton onClick={onStartRename} title="Rename group">
        ✏️
      </EditButton>
    </TitleRow>
  );
}
