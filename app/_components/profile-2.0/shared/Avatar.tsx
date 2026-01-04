"use client";
import React from "react";
import {
  AvatarWrapper,
  AvatarContainer,
  StyledImage,
} from "./AvatarElements";

/**
 * Avatar Component
 * A modern, animated avatar component with glassmorphism effects
 * Features: Hover animations, gradient borders, responsive sizing
 */

interface AvatarProps {
  src: string;
  alt: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({

  src,
  alt,
  size = "medium",
  className,
}) => {
  return (
    <AvatarWrapper $size={size} className={className}>
      <AvatarContainer>
        <StyledImage>
          <img src={src} alt={alt} />
        </StyledImage>
      </AvatarContainer>
    </AvatarWrapper>
  );
};

export default Avatar;
