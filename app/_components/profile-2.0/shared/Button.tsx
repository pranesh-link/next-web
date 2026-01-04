"use client";
import React from "react";
import { StyledButton, IconWrapper } from "./ButtonElements";

/**
 * Button Component
 * Modern button with multiple variants and animations
 * Features: Gradient backgrounds, smooth transitions, ripple effects
 */

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({

  children,
  onClick,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  icon,
  className,
}) => {
  return (
    <StyledButton
      onClick={onClick}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled}
      className={className}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {children}
    </StyledButton>
  );
};

export default Button;
