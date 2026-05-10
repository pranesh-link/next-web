"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Card, SectionTitle, Button } from "@/couple/lifestyle/wellness/_styled";

/** Submitted log entry payload. */
export interface LogEntryInput {
  /** Date the measurement was taken (local midnight). */
  measuredOn: Date;
  /** Weight in kilograms. */
  weightInKg: number;
  /** Height in centimetres. */
  heightInCm: number;
  /** Optional free-form note. */
  note?: string;
}

/**
 * Props for {@link LogEntryForm}.
 *
 * @param defaults - Default values for height/weight inputs. Use `0` to render empty.
 * @param onSubmit - Async submit handler. Called only when validation passes.
 * @param saving - Disables the submit button and shows a saving label.
 * @param heightLocked - When true, the height input is disabled (height is one-time). Defaults to `defaults.heightInCm > 0`.
 * @param existingDates - ISO date strings (YYYY-MM-DD) of already-logged entries, used to prevent duplicates.
 * @param onDuplicate - Called when the user tries to submit a date that already has an entry. Parent handles the toast.
 */
export interface Props {
  /** Default values for height/weight inputs. Use `0` to render empty. */
  defaults: { heightInCm: number; weightInKg: number };
  /** Async submit handler. Called only when validation passes. */
  onSubmit: (input: LogEntryInput) => Promise<void>;
  /** Disables the submit button and shows a saving label. */
  saving: boolean;
  /** When true, the height input is disabled. Defaults to `defaults.heightInCm > 0`. */
  heightLocked?: boolean;
  /** ISO date strings (YYYY-MM-DD) of already-logged entries. */
  existingDates?: string[];
  /** Called when a duplicate date is detected. Parent handles the toast. */
  onDuplicate?: () => void;
}

const Grid = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
`;

const Input = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 14px;
  width: 100%;
  min-width: 0;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`;

const Error = styled.p`
  color: var(--danger);
  font-size: 12px;
  margin: 4px 0 0;
`;

const Actions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
`;

const Note = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`;

const UnlockButton = styled.button`
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  margin-left: 4px;
`;

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Form to log a single body-metric entry (date, weight, height, note).
 * Performs inline validation: weight 20–500 kg, height 50–300 cm.
 * Resets weight, note, and date after a successful save; height is retained.
 * Prevents duplicate entries for the same date via `existingDates` / `onDuplicate`.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the entry form.
 */
export default function LogEntryForm({
  defaults,
  onSubmit,
  saving,
  heightLocked: heightLockedProp,
  existingDates,
  onDuplicate,
}: Props) {
  const [date, setDate] = useState<string>(todayIso());
  const [weight, setWeight] = useState<string>(
    defaults.weightInKg ? String(defaults.weightInKg) : "",
  );
  const [height, setHeight] = useState<string>(
    defaults.heightInCm ? String(defaults.heightInCm) : "",
  );
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const isHeightLocked = heightLockedProp ?? defaults.heightInCm > 0;
  const [heightUnlocked, setHeightUnlocked] = useState(false);
  const heightDisabled = isHeightLocked && !heightUnlocked;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (existingDates?.includes(date)) {
      onDuplicate?.();
      return;
    }

    const w = Number(weight);
    const h = Number(height);
    if (!Number.isFinite(w) || w < 20 || w > 500) {
      setError("Weight must be between 20 and 500 kg.");
      return;
    }
    if (!Number.isFinite(h) || h < 50 || h > 300) {
      setError("Height must be between 50 and 300 cm.");
      return;
    }
    const measuredOn = new Date(date);
    if (Number.isNaN(measuredOn.getTime())) {
      setError("Please enter a valid date.");
      return;
    }
    await onSubmit({
      measuredOn,
      weightInKg: w,
      heightInCm: h,
      note: note.trim() ? note.trim() : undefined,
    });

    setWeight("");
    setNote("");
    setDate(todayIso());
  }

  return (
    <Card>
      <SectionTitle>Log entry</SectionTitle>
      <Grid onSubmit={handleSubmit} noValidate>
        <Field>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>
        <Field>
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 72.5"
            required
          />
        </Field>
        <Field>
          <Label>
            Height (cm)
            {heightDisabled && (
              <UnlockButton
                type="button"
                onClick={() => setHeightUnlocked(true)}
                aria-label="Edit height"
              >
                ✎
              </UnlockButton>
            )}
          </Label>
          <Input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 175"
            required
            disabled={heightDisabled}
          />
          {heightDisabled && <Note>Height is set once across entries</Note>}
        </Field>
        <Field>
          <Label>Note (optional)</Label>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything to remember?"
          />
        </Field>
        {error ? (
          <Actions>
            <Error role="alert">{error}</Error>
          </Actions>
        ) : null}
        <Actions>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Actions>
      </Grid>
    </Card>
  );
}
