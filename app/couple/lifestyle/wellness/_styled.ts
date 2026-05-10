"use client";

import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Top-level page wrapper with safe horizontal overflow. */
export const PageWrapper = styled.main`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

/** Two-column responsive grid that collapses to one column on tablets. */
export const Grid2Col = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/** Full-width section block; vertical spacing is provided by {@link PageWrapper} gap. */
export const FullSection = styled.section`
  min-width: 0;
`;

/** Surfaced card with safe shrinking inside flex/grid parents. */
export const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  min-width: 0;
`;

/** Section heading rendered at h2 level. */
export const SectionTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
`;

/** Muted, smaller body copy. */
export const Subtle = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
`;

/** Primary action button. */
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.2s ${EASING},
    filter 0.2s ${EASING},
    box-shadow 0.2s ${EASING};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/** Secondary / outline button using the same shape as {@link Button}. */
export const GhostButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.2s ${EASING},
    border-color 0.2s ${EASING};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--accent);
    color: var(--accent);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/**
 * Coloured pill used for BMI band chips.
 *
 * The optional `$active` transient prop adds a subtle outline when the
 * pill represents the current band.
 */
export const BandPill = styled.span<{ $bg: string; $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: ${(p) => p.$bg};
  color: #ffffff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  outline: ${(p) => (p.$active ? "2px solid #ffffff" : "none")};
  outline-offset: ${(p) => (p.$active ? "1px" : "0")};
`;

/** Horizontal flex row with wrapping items. */
export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;
