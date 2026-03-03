"use client";
import React from "react";
import styled from "styled-components";

/**
 * Card Component
 * A modern glassmorphism card with hover effects
 * Features: Smooth animations, backdrop blur, responsive padding
 * Design choice: Card-based layout for better content organization and visual hierarchy
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "outlined";
  hoverable?: boolean;
}

const StyledCard = styled.div<{ $variant: string; $hoverable: boolean }>`
  background: ${(props) => {
    switch (props.$variant) {
      case "gradient":
        return "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)";
      case "outlined":
        return "transparent";
      default:
        return "rgba(255, 255, 255, 0.92)";
    }
  }};
  border-radius: 24px;
  padding: 32px;
  margin: 16px 0;
  box-shadow: ${(props) =>
    props.$variant === "outlined"
      ? "0 0 0 2px rgba(55, 65, 81, 0.2)"
      : "0 10px 40px rgba(0, 0, 0, 0.08)"};
  border: ${(props) =>
    props.$variant === "outlined" ? "2px solid rgba(99, 102, 241, 0.2)" : "1px solid rgba(226, 232, 240, 0.8)"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* Accent left border on hover */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 0 2px 2px 0;
  }

  ${(props) =>
    props.$hoverable &&
    `
    cursor: pointer;
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.25);
      
      &::before {
        opacity: 1;
      }
    }
    
    &:active {
      transform: translateY(-1px);
    }
  `}

  @media screen and (max-width: 768px) {
    padding: 24px;
    margin: 12px 0;
    border-radius: 20px;
  }

  @media screen and (max-width: 480px) {
    padding: 16px;
    border-radius: 16px;
  }

  @media screen and (max-width: 360px) {
    padding: 12px;
  }
`;

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  hoverable = false,
}) => {
  return (
    <StyledCard $variant={variant} $hoverable={hoverable} className={className}>
      {children}
    </StyledCard>
  );
};

/**
 * CardHeader Component
 * Styled header for cards with consistent typography
 */
interface CardHeaderProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const StyledCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  
  h3 {
    color: #1f2937;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media screen and (max-width: 768px) {
    margin-bottom: 20px;
    
    h3 {
      font-size: 24px;
    }
  }

  @media screen and (max-width: 480px) {
    h3 {
      font-size: 20px;
    }
  }
`;

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

  @media screen and (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
`;

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  icon,
  className,
}) => {
  return (
    <StyledCardHeader className={className}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <h3>{children}</h3>
    </StyledCardHeader>
  );
};

/**
 * CardContent Component
 * Content area with proper spacing and typography
 */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const StyledCardContent = styled.div`
  color: #4b5563;
  line-height: 1.7;
  font-size: 16px;

  p {
    margin: 0 0 16px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  @media screen and (max-width: 768px) {
    font-size: 15px;
    line-height: 1.6;
  }
`;

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => {
  return <StyledCardContent className={className}>{children}</StyledCardContent>;
};

export default Card;
