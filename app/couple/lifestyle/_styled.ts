"use client";

import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Top-level wrapper for the lifestyle module landing page. */
export const PageWrapper = styled.main`
  padding: 24px;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

/**
 * Responsive tile grid: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * A single navigable lifestyle tile. Renders as an anchor so it can wrap
 * a Next `<Link>` via `passHref` or be used directly as `<a>`.
 */
export const Tile = styled.a`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  text-decoration: none;
  transition:
    transform 0.2s ${EASING},
    box-shadow 0.2s ${EASING},
    border-color 0.2s ${EASING};
  min-width: 0;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }

  svg {
    width: 28px;
    height: 28px;
    color: var(--accent);
  }
`;

/** Tile heading. */
export const TileTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
`;

/** Tile description text. */
export const TileDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
`;
