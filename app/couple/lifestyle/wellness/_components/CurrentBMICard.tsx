"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Card, SectionTitle, BandPill, Subtle, GhostButton } from "@/couple/lifestyle/wellness/_styled";
import type { WellnessSuggestion } from "@/_services/lifestyle/insights";
import Modal from "@/couple/_components/shared/Modal";
import { SUGGESTION_COLORS } from "@/couple/_constants/suggestion-colors";

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
  /** Optional coaching suggestions to display in a modal. */
  suggestions?: WellnessSuggestion[];
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
        : "var(--text)"};
  opacity: ${(p) => (p.$tone === "neutral" ? 0.7 : 1)};
`;

const SuggestionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SuggestionRow = styled.li<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-left: 3px solid ${(p) => p.$color};
  border-radius: 6px;
  background: var(--bg-elevated);
  font-size: 14px;
  color: var(--text);
`;

function tone(delta: number, bandKey: string | undefined): "good" | "bad" | "neutral" {
  const heavyBand = bandKey === "overweight" || bandKey === "obese";
  if (delta > 0 && heavyBand) return "bad";
  if (delta < 0 && heavyBand) return "good";
  return "neutral";
}

/**
 * Hero card showing the user's current BMI value, active band, weight
 * delta for the past week, and optional smart coaching suggestions.
 *
 * @param props - See {@link Props}.
 * @returns A card with BMI summary, or a placeholder when `bmi === 0`.
 */
export default function CurrentBMICard({ bmi, band, deltaWeek, suggestions }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      {suggestions && suggestions.length > 0 && (
        <GhostButton onClick={() => setShowSuggestions(true)}>💡 Smart suggestions</GhostButton>
      )}
      <Modal
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        title="Smart suggestions"
      >
        <SuggestionList>
          {suggestions?.map((s, i) => (
            <SuggestionRow key={i} $color={SUGGESTION_COLORS[s.type] ?? "var(--border)"}>
              <span>{s.icon}</span>
              <span>{s.text}</span>
            </SuggestionRow>
          ))}
        </SuggestionList>
      </Modal>
    </Card>
  );
}
