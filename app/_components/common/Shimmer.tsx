"use client";
import styled, { keyframes } from "styled-components";

const Shimmer = () => {
  return (
    <ShimmerWrap>
      {/* Hero skeleton */}
      <HeroSkeleton>
        <AvatarPlaceholder />
        <TitlePlaceholder />
        <SubtitlePlaceholder />
      </HeroSkeleton>
      {/* Card skeletons */}
      <CardGrid>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </CardGrid>
    </ShimmerWrap>
  );
};

export default Shimmer;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const ShimmerWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px 24px;
  gap: 40px;
`;

const HeroSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 480px;
`;

const shimmerBlock = `
  background: linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 50%, #cbd5e1 100%);
  border-radius: 12px;
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
`;

const AvatarPlaceholder = styled.div`
  ${shimmerBlock}
  width: 96px;
  height: 96px;
  border-radius: 50%;
  animation-name: ${pulse};
`;

const TitlePlaceholder = styled.div`
  ${shimmerBlock}
  width: 200px;
  height: 28px;
  animation-name: ${pulse};
  animation-delay: 0.2s;
`;

const SubtitlePlaceholder = styled.div`
  ${shimmerBlock}
  width: 300px;
  height: 18px;
  animation-name: ${pulse};
  animation-delay: 0.4s;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 1200px;
`;

const CardSkeleton = styled.div`
  ${shimmerBlock}
  height: 200px;
  animation-name: ${pulse};
  animation-delay: 0.3s;
`;
