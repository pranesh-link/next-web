'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

/** Props for SkeletonCard. */
export interface SkeletonCardProps {
  /** Number of cards to render. Defaults to 1. */
  count?: number;
}

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Bone = styled.div<{ $width?: string; $height?: string }>`
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--border) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite ease-in-out;
  border-radius: 6px;
  width: ${(p) => p.$width ?? '100%'};
  height: ${(p) => p.$height ?? '14px'};
`;

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;

  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 12px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const ValueRow = styled.div`
  margin-bottom: 8px;
`;

function SingleCard() {
  return (
    <Card>
      <TitleRow>
        <Bone $width="96px" $height="12px" />
        <Bone $width="28px" $height="28px" />
      </TitleRow>
      <ValueRow>
        <Bone $width="140px" $height="28px" />
      </ValueRow>
      <Bone $width="80px" $height="12px" />
    </Card>
  );
}

/**
 * A card-shaped skeleton matching the finance summary card layout.
 * Use for loading states on dashboard and list pages.
 */
export default function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  if (count === 1) return <SingleCard />;

  return (
    <Grid>
      {Array.from({ length: count }).map((_, i) => (
        <SingleCard key={i} />
      ))}
    </Grid>
  );
}
