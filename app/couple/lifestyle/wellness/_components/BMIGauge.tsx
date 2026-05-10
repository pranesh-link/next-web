"use client";

import React from "react";
import styled from "styled-components";
import { Card, SectionTitle } from "@/couple/lifestyle/wellness/_styled";
import { EASING } from "@/couple/_constants/theme";
import type { BmiBand } from "@/couple/lifestyle/wellness/_constants";

/** Props for {@link BMIGauge}. */
export interface Props {
  /** Current BMI value. Clamped to the gauge range (10–40) for display. */
  bmi: number;
  /** BMI bands that color the arc. Expected to span 10–40 contiguously. */
  bands: ReadonlyArray<BmiBand>;
}

const GAUGE_MIN = 10;
const GAUGE_MAX = 40;
const CX = 100;
const CY = 100;
const R = 80;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Svg = styled.svg`
  width: 100%;
  max-width: 280px;
  height: auto;
  display: block;
`;

const Needle = styled.line<{ $rotation: number }>`
  transform-origin: ${CX}px ${CY}px;
  transform: rotate(${(p) => p.$rotation}deg);
  transition: transform 600ms ${EASING};
`;

const Value = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
`;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function bmiToAngle(bmi: number): number {
  const t = (clamp(bmi, GAUGE_MIN, GAUGE_MAX) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
  return 180 - t * 180;
}

function polar(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
}

function arcPath(startBmi: number, endBmi: number) {
  const start = polar(bmiToAngle(startBmi));
  const end = polar(bmiToAngle(endBmi));
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R} ${R} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * Semicircle BMI gauge with colored band segments and an animated needle.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the gauge SVG and current value label.
 */
export default function BMIGauge({ bmi, bands }: Props) {
  const rotation = bmiToAngle(bmi) * -1 + 90;
  // bmiToAngle returns 180..0 (left..right). Needle rotation: at bmi 10 → -90deg, bmi 40 → +90deg.
  // -bmiToAngle + 90 = -(180..0) + 90 = -90..90. ✓
  return (
    <Card>
      <SectionTitle>BMI gauge</SectionTitle>
      <Wrapper>
        <Svg viewBox="0 0 200 120" role="img" aria-label={`BMI gauge showing ${bmi.toFixed(1)}`}>
          {bands.map((b) => (
            <path
              key={b.key}
              d={arcPath(b.min, b.max)}
              stroke={b.color}
              strokeWidth={14}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
          <Needle
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 6}
            stroke="var(--text)"
            strokeWidth={3}
            strokeLinecap="round"
            $rotation={rotation}
            data-testid="bmi-gauge-needle"
          />
          <circle cx={CX} cy={CY} r={5} fill="var(--text)" />
        </Svg>
        <Value>{bmi.toFixed(1)}</Value>
      </Wrapper>
    </Card>
  );
}
