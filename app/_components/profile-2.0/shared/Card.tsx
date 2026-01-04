"use client";
import React from "react";
import {
  StyledCard,
  StyledCardHeader,
  IconWrapper,
  StyledCardContent,
} from "./CardElements";

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

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => {
  return <StyledCardContent className={className}>{children}</StyledCardContent>;
};

export default Card;
