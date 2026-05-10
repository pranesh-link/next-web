"use client";

import React from "react";
import styled from "styled-components";
import { Card, SectionTitle } from "@/couple/lifestyle/wellness/_styled";

const BodyText = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text);
  opacity: 0.75;
`;

/** Props for {@link IdealWeightCard}. */
export interface Props {
  /** Most recent measured weight in kg. */
  currentWeight: number;
  /** Optional user-defined target weight in kg. */
  target: number | null;
  /** Lower bound of the healthy weight window in kg. */
  healthyMinKg: number;
  /** Upper bound of the healthy weight window in kg. */
  healthyMaxKg: number;
}

function gapLine(currentWeight: number, healthyMinKg: number, healthyMaxKg: number): string {
  if (currentWeight < healthyMinKg) {
    return `Gain ${(healthyMinKg - currentWeight).toFixed(1)} kg to reach healthy`;
  }
  if (currentWeight > healthyMaxKg) {
    return `Lose ${(currentWeight - healthyMaxKg).toFixed(1)} kg to reach healthy`;
  }
  return "You're in the healthy range ✓";
}

/**
 * Card showing the healthy weight window for the current height plus
 * an actionable gap message. Optionally displays a user-defined target.
 * Uses mild-black body text for readability.
 *
 * @param props - See {@link Props}.
 * @returns A card with ideal-weight guidance.
 */
export default function IdealWeightCard({
  currentWeight,
  target,
  healthyMinKg,
  healthyMaxKg,
}: Props) {
  return (
    <Card>
      <SectionTitle>Ideal weight</SectionTitle>
      <BodyText>
        Healthy: {healthyMinKg.toFixed(1)} – {healthyMaxKg.toFixed(1)} kg
      </BodyText>
      <BodyText>{gapLine(currentWeight, healthyMinKg, healthyMaxKg)}</BodyText>
      {target != null ? (
        <BodyText>
          Target: {target.toFixed(1)} kg ({(currentWeight - target).toFixed(1)} kg to go)
        </BodyText>
      ) : null}
    </Card>
  );
}
