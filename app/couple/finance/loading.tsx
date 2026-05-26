"use client";

import React from "react";
import styled from "styled-components";
import SkeletonCard from "@/couple/_components/shared/SkeletonCard";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
`;

const ChartRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export default function FinanceLoading() {
  return (
    <Wrapper>
      <SkeletonCard count={7} />
      <ChartRow>
        <LoadingSkeleton type="chart" />
        <LoadingSkeleton type="chart" />
      </ChartRow>
      <LoadingSkeleton type="table" />
    </Wrapper>
  );
}
