"use client";
import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const DividerContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 24px;
  box-sizing: border-box;
`;

const Line = styled.div`
  width: 100%;
  max-width: 600px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--border) 20%,
    var(--accent) 50%,
    var(--border) 80%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 6s ease-in-out infinite;
  opacity: 0.6;
`;

const SectionDivider: React.FC = () => (
  <DividerContainer>
    <Line />
  </DividerContainer>
);

export default SectionDivider;
