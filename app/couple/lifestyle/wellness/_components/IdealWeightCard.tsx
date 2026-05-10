"use client";

import React from "react";
import { Card, SectionTitle, Subtle } from "@/couple/lifestyle/wellness/_styled";

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
      <Subtle>
        Healthy: {healthyMinKg.toFixed(1)} – {healthyMaxKg.toFixed(1)} kg
      </Subtle>
      <Subtle>{gapLine(currentWeight, healthyMinKg, healthyMaxKg)}</Subtle>
      {target != null ? (
        <Subtle>
          Target: {target.toFixed(1)} kg ({(currentWeight - target).toFixed(1)} kg to go)
        </Subtle>
      ) : null}
    </Card>
  );
}
