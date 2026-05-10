"use client";

import React from "react";
import { Card, BandPill, Row, SectionTitle } from "@/couple/lifestyle/wellness/_styled";
import { BMI_BANDS } from "@/couple/lifestyle/wellness/_constants";

/** Props for {@link BMIRangeLegend}. */
export interface Props {
  /** Bands to render. Use {@link BMI_BANDS} for the standard set. */
  bands: typeof BMI_BANDS;
  /** Key of the band currently active for the user, or `null`. */
  currentKey: string | null;
}

/**
 * Legend strip showing all BMI bands with the active one highlighted.
 *
 * @param props - See {@link Props}.
 * @returns A card containing band pills in a flex row.
 */
export default function BMIRangeLegend({ bands, currentKey }: Props) {
  return (
    <Card>
      <SectionTitle>BMI ranges</SectionTitle>
      <Row>
        {bands.map((b) => (
          <BandPill key={b.key} $bg={b.color} $active={b.key === currentKey}>
            {b.label} ({b.min}–{b.max})
          </BandPill>
        ))}
      </Row>
    </Card>
  );
}
