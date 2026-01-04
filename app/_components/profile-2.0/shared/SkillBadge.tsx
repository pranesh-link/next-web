"use client";
import React from "react";
import {
  BadgeContainer,
  SkillLabel,
  StarsContainer,
  Star,
  SimpleTag,
} from "./SkillBadgeElements";

/**
 * SkillBadge Component
 * Modern skill badge with star rating
 * Features: Gradient backgrounds, animated stars, responsive design
 */

interface SkillBadgeProps {
  label: string;
  rating?: number; // 0-5 stars
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  label,
  rating,
  className,
}) => {
  const renderStars = () => {
    if (rating === undefined) return null;
    
    return (
      <StarsContainer>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} $filled={star <= rating} />
        ))}
      </StarsContainer>
    );
  };

  return (
    <BadgeContainer className={className}>
      <SkillLabel>{label}</SkillLabel>
      {renderStars()}
    </BadgeContainer>
  );
};

/**
 * SimpleSkillTag Component
 * Simpler version without ratings for tags
 */
interface SimpleSkillTagProps {
  label: string;
  className?: string;
}

export const SimpleSkillTag: React.FC<SimpleSkillTagProps> = ({
  label,
  className,
}) => {
  return <SimpleTag className={className}>{label}</SimpleTag>;
};

export default SkillBadge;
