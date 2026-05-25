'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

/** Props for the reusable Skeleton component. */
export interface SkeletonProps {
  /** Width of the skeleton element (CSS value). Defaults to '100%'. */
  width?: string;
  /** Height of the skeleton element (CSS value). Defaults to '16px'. */
  height?: string;
  /** Border radius of the skeleton element (CSS value). Defaults to '6px'. */
  borderRadius?: string;
  /** Number of skeleton lines to render. Defaults to 1. */
  count?: number;
  /** Gap between lines when count > 1. Defaults to '8px'. */
  gap?: string;
}

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Bone = styled.div<{
  $width: string;
  $height: string;
  $borderRadius: string;
}>`
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--border) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite ease-in-out;
  border-radius: ${(p) => p.$borderRadius};
  width: ${(p) => p.$width};
  height: ${(p) => p.$height};
`;

const Stack = styled.div<{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.$gap};
`;

/**
 * A reusable skeleton loading placeholder with shimmer animation.
 * Dark-mode aware via CSS variables.
 */
export default function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  count = 1,
  gap = '8px',
}: SkeletonProps) {
  if (count === 1) {
    return (
      <Bone $width={width} $height={height} $borderRadius={borderRadius} />
    );
  }

  return (
    <Stack $gap={gap}>
      {Array.from({ length: count }).map((_, i) => (
        <Bone
          key={i}
          $width={width}
          $height={height}
          $borderRadius={borderRadius}
        />
      ))}
    </Stack>
  );
}
