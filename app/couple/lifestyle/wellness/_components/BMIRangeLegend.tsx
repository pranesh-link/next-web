"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Card, BandPill, Row, SectionTitle } from "@/couple/lifestyle/wellness/_styled";
import { BMI_BANDS, BAND_INSIGHTS } from "@/couple/lifestyle/wellness/_constants";
import type { BandKey } from "@/couple/lifestyle/wellness/_constants";
import Modal from "@/couple/_components/shared/Modal";

/** Wraps a {@link BandPill} to make it clickable with a hover effect. */
const ClickablePill = styled(BandPill)`
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;

  &:hover {
    filter: brightness(1.15);
    transform: scale(1.06);
  }
`;

/** Styled recommendation paragraph with accent-coloured italic text. */
const Recommendation = styled.p`
  margin: 12px 0 0;
  font-size: 14px;
  font-style: italic;
  color: var(--accent);
  line-height: 1.5;
`;

/** Description paragraph inside the insights modal. */
const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
`;

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
 * Each pill is clickable — tapping it opens a modal with health insights
 * and recommendations for that BMI band.
 *
 * @param props - See {@link Props}.
 * @returns A card containing clickable band pills in a flex row.
 */
export default function BMIRangeLegend({ bands, currentKey }: Props) {
  const [selectedBand, setSelectedBand] = useState<BandKey | null>(null);
  const insight = selectedBand ? BAND_INSIGHTS[selectedBand] : null;

  return (
    <Card>
      <SectionTitle>BMI ranges</SectionTitle>
      <Row>
        {bands.map((b) => (
          <ClickablePill
            key={b.key}
            $bg={b.color}
            $active={b.key === currentKey}
            onClick={() => setSelectedBand(b.key)}
          >
            {b.label} ({b.min}–{b.max})
          </ClickablePill>
        ))}
      </Row>

      <Modal
        isOpen={!!selectedBand}
        onClose={() => setSelectedBand(null)}
        title={insight?.title ?? ""}
        size="md"
      >
        {insight && (
          <>
            <Description>{insight.description}</Description>
            <Recommendation>{insight.recommendation}</Recommendation>
          </>
        )}
      </Modal>
    </Card>
  );
}
