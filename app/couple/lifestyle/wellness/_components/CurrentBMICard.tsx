"use client";

import React from "react";
import styled from "styled-components";
import { Card, SectionTitle, BandPill, Subtle } from "@/couple/lifestyle/wellness/_styled";

/** BMI band metadata as displayed in the card. */
export interface CurrentBMIBand {
  /** Band id (e.g. "overweight"). */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Hex color for the band pill. */
  color: string;
}

/** Props for {@link CurrentBMICard}. */
export interface Props {
  /** Current BMI value. Pass `0` to render the placeholder state. */
  bmi: number;
  /** Active band — `null` when there is no data. */
  band: CurrentBMIBand | null;
  /** Net weight change over the last 7 days in kg. */
  deltaWeek: number;
}

const Big = styled.div`
  font-size: 56px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 44px;
  }
`;

const DeltaLine = styled(Subtle)<{ $tone: "good" | "bad" | "neutral" }>`
  color: ${(p) =>
    p.$tone === "bad"
      ? "var(--danger)"
      : p.$tone === "good"
        ? "var(--accent)"
        : "var(--text-muted)"};
`;

function tone(delta: number, bandKey: string | undefined): "good" | "bad" | "neutral" {
  const heavyBand = bandKey === "overweight" || bandKey === "obese";
  if (delta > 0 && heavyBand) return "bad";
  if (delta < 0 && heavyBand) return "good";
  return "neutral";
}

/**
 * Hero card showing the user's current BMI value, active band and the
 * weight delta for the past week.
 *
 * @param props - See {@link Props}.
 * @returns A card with BMI summary or a placeholder when `bmi === 0`.
 */
export default function CurrentBMICard({ bmi, band, deltaWeek }: Props) {
  if (bmi === 0) {
    return (
      <Card>
        <SectionTitle>Current BMI</SectionTitle>
        <BandPill $bg="var(--text-muted)">Log to see your BMI</BandPill>
        <Subtle>Add your first entry to begin tracking.</Subtle>
      </Card>
    );
  }
  const sign = deltaWeek > 0 ? "+" : "";
  return (
    <Card>
      <SectionTitle>Current BMI</SectionTitle>
      <Big>{bmi.toFixed(1)}</Big>
      <BandPill $bg={band?.color ?? "var(--text-muted)"}>{band?.label ?? "—"}</BandPill>
      <DeltaLine $tone={tone(deltaWeek, band?.key)}>
        Δ this week: {sign}
        {deltaWeek.toFixed(1)} kg
      </DeltaLine>
    </Card>
  );
}
