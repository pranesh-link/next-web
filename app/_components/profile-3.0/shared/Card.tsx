"use client";
import React from "react";
import styled from "styled-components";

const StyledCard = styled.div<{ $hoverable?: boolean }>`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  ${(props) =>
    props.$hoverable &&
    `
    &:hover {
      border-color: rgba(59, 130, 246, 0.3);
      background: var(--surface-hover);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
    }
  `}

  @media screen and (max-width: 768px) {
    padding: 24px;
    border-radius: 12px;
  }

  @media screen and (max-width: 480px) {
    padding: 20px;
  }
`;

const StyledCardHeader = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;

  &::before {
    content: "";
    width: 3px;
    height: 20px;
    background: linear-gradient(135deg, var(--accent) 0%, #22d3ee 100%);
    border-radius: 2px;
  }

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`;

const StyledCardContent = styled.div`
  color: var(--text-dim);
`;

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const DarkCard: React.FC<CardProps> = ({
  children,
  hoverable,
  className,
}) => (
  <StyledCard $hoverable={hoverable} className={className}>
    {children}
  </StyledCard>
);

export const DarkCardHeader: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <StyledCardHeader>{children}</StyledCardHeader>;

export const DarkCardContent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <StyledCardContent>{children}</StyledCardContent>;
