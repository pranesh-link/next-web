"use client";

import { SkeletonCard, SkeletonLine } from "../_styled";

export default function LoadingSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonLine $width="40%" $height="20px" />
      <SkeletonLine $width="70%" />
      <SkeletonLine $width="55%" />
      <SkeletonLine $width="100%" $height="44px" />
    </SkeletonCard>
  );
}
