'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingSkeletonProps {
  type: 'card' | 'table' | 'chart' | 'form';
  count?: number;
}

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Bone = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
  $mb?: string;
  $ml?: string;
}>`
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--surface-hover) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite ease-in-out;
  border-radius: ${(p) => p.$radius ?? '6px'};
  width: ${(p) => p.$width ?? '100%'};
  height: ${(p) => p.$height ?? '14px'};
  ${(p) => (p.$mb ? `margin-bottom: ${p.$mb};` : '')}
  ${(p) => (p.$ml ? `margin-left: ${p.$ml};` : '')}
`;

const CardWrapper = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
`;

const TableWrapper = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 32px;
`;

const TableRow = styled.div`
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 32px;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }
`;

const ChartBarContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 224px;
  padding-top: 16px;
`;

const BarCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
  justify-content: flex-end;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 8px;
`;

const CardGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StackLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BAR_HEIGHTS = [45, 70, 55, 85, 40, 65, 75];

function CardSkeleton() {
  return (
    <CardWrapper>
      <Bone $width="96px" $height="12px" $mb="12px" />
      <Bone $width="128px" $height="28px" $mb="8px" />
      <Bone $width="80px" $height="12px" />
    </CardWrapper>
  );
}

function TableSkeleton() {
  return (
    <TableWrapper>
      <TableHeader>
        <Bone $width="64px" $height="12px" />
        <Bone $width="128px" $height="12px" />
        <Bone $width="80px" $height="12px" />
        <Bone $width="64px" $height="12px" $ml="auto" />
      </TableHeader>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <Bone $width="80px" $height="14px" />
          <Bone $width="160px" $height="14px" />
          <Bone $width="64px" $height="20px" $radius="12px" />
          <Bone $width="80px" $height="14px" $ml="auto" />
        </TableRow>
      ))}
    </TableWrapper>
  );
}

function ChartSkeleton() {
  return (
    <CardWrapper>
      <Bone $width="128px" $height="16px" $mb="16px" />
      <ChartBarContainer>
        {BAR_HEIGHTS.map((h, i) => (
          <BarCol key={i}>
            <Bone $width="100%" $height={`${h}%`} />
            <Bone $width="32px" $height="10px" />
          </BarCol>
        ))}
      </ChartBarContainer>
    </CardWrapper>
  );
}

function FormSkeleton() {
  return (
    <CardWrapper>
      {Array.from({ length: 4 }).map((_, i) => (
        <FormGroup key={i}>
          <Bone $width="80px" $height="12px" $mb="6px" />
          <Bone $height="40px" $radius="8px" />
        </FormGroup>
      ))}
      <ButtonRow>
        <Bone $width="96px" $height="40px" $radius="8px" />
        <Bone $width="80px" $height="40px" $radius="8px" />
      </ButtonRow>
    </CardWrapper>
  );
}

const skeletonMap: Record<LoadingSkeletonProps['type'], () => React.ReactElement> = {
  card: () => <CardSkeleton />,
  table: () => <TableSkeleton />,
  chart: () => <ChartSkeleton />,
  form: () => <FormSkeleton />,
};

export default function LoadingSkeleton({ type, count = 1 }: LoadingSkeletonProps) {
  const Skeleton = skeletonMap[type];

  if (type === 'card' && count > 1) {
    return (
      <CardGrid>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </CardGrid>
    );
  }

  return (
    <StackLayout>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </StackLayout>
  );
}
