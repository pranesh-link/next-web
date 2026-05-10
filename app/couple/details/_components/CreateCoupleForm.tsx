"use client";

import {
  SoloCard,
  CardIcon,
  CardTitle,
  CardDescription,
  FieldGroup,
  Label,
  Input,
  ErrorText,
  PrimaryButton,
} from "../_styled";

type Props = {
  coupleName: string;
  onCoupleNameChange: (value: string) => void;
  saving: boolean;
  error: string;
  onCreate: () => void;
};

export default function CreateCoupleForm({
  coupleName,
  onCoupleNameChange,
  saving,
  error,
  onCreate,
}: Props) {
  return (
    <SoloCard>
      <CardIcon>💑</CardIcon>
      <CardTitle>Start Your Couple Journey</CardTitle>
      <CardDescription>
        Link with your partner to manage finances together
      </CardDescription>
      <FieldGroup>
        <Label>Couple Name (optional)</Label>
        <Input
          placeholder="e.g. The Smiths"
          value={coupleName}
          onChange={(e) => onCoupleNameChange(e.target.value)}
        />
      </FieldGroup>
      {error && <ErrorText>{error}</ErrorText>}
      <PrimaryButton type="button" disabled={saving} onClick={onCreate}>
        {saving ? "Creating…" : "Create Couple"}
      </PrimaryButton>
    </SoloCard>
  );
}
