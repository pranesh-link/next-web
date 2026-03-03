"use client";
import React from "react";
import styled from "styled-components";

/**
 * SkillBadge Component
 * Modern skill badge with star rating
 * Features: Gradient backgrounds, animated stars, responsive design
 */

interface SkillBadgeProps {
  label: string;
  rating?: number; // 0-5 stars
  className?: string;
  accentColor?: "indigo" | "teal" | "amber";
}

const accentStyles = {
  indigo: {
    bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.06) 100%)',
    border: 'rgba(99, 102, 241, 0.2)',
    hoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(79, 70, 229, 0.1) 100%)',
    hoverBorder: 'rgba(99, 102, 241, 0.35)',
    hoverShadow: 'rgba(99, 102, 241, 0.15)',
  },
  teal: {
    bg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(13, 148, 136, 0.06) 100%)',
    border: 'rgba(20, 184, 166, 0.2)',
    hoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.14) 0%, rgba(13, 148, 136, 0.1) 100%)',
    hoverBorder: 'rgba(20, 184, 166, 0.35)',
    hoverShadow: 'rgba(20, 184, 166, 0.15)',
  },
  amber: {
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.06) 100%)',
    border: 'rgba(245, 158, 11, 0.2)',
    hoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.1) 100%)',
    hoverBorder: 'rgba(245, 158, 11, 0.35)',
    hoverShadow: 'rgba(245, 158, 11, 0.15)',
  },
};

const BadgeContainer = styled.div<{ $accent?: string; $accentBorder?: string; $hoverBg?: string; $hoverBorder?: string; $hoverShadow?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: ${(props) => props.$accent || 'linear-gradient(135deg, rgba(55, 65, 81, 0.1) 0%, rgba(31, 41, 55, 0.1) 100%)'};
  padding: 12px 20px;
  border-radius: 16px;
  border: 1px solid ${(props) => props.$accentBorder || 'rgba(55, 65, 81, 0.2)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(55, 65, 81, 0.08);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px ${(props) => props.$hoverShadow || 'rgba(99, 102, 241, 0.15)'};
    background: ${(props) => props.$hoverBg || 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)'};
    border-color: ${(props) => props.$hoverBorder || 'rgba(99, 102, 241, 0.3)'};
    position: relative;
    z-index: 1;
  }

  @media screen and (max-width: 768px) {
    padding: 10px 16px;
    gap: 10px;
    margin: 4px;
  }

  @media screen and (max-width: 480px) {
    padding: 8px 14px;
    gap: 8px;
  }
`;

const SkillLabel = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const StarsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const Star = styled.div<{ $filled: boolean }>`
  width: 16px;
  height: 16px;
  position: relative;
  
  &::before {
    content: "★";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: ${(props) => (props.$filled ? "#fbbf24" : "#e5e7eb")};
    transition: all 0.3s ease;
    text-shadow: ${(props) =>
      props.$filled ? "0 2px 4px rgba(251, 191, 36, 0.3)" : "none"};
  }

  ${BadgeContainer}:hover &::before {
    ${(props) =>
      props.$filled &&
      `
      transform: translate(-50%, -50%) scale(1.2);
      filter: brightness(1.2);
    `}
  }

  @media screen and (max-width: 768px) {
    width: 14px;
    height: 14px;
    
    &::before {
      font-size: 16px;
    }
  }
`;

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  label,
  rating,
  className,
  accentColor = "indigo",
}) => {
  const accent = accentStyles[accentColor];

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
    <BadgeContainer
      className={className}
      $accent={accent.bg}
      $accentBorder={accent.border}
      $hoverBg={accent.hoverBg}
      $hoverBorder={accent.hoverBorder}
      $hoverShadow={accent.hoverShadow}
    >
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

const SimpleTag = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(55, 65, 81, 0.3);
  cursor: default;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(55, 65, 81, 0.4);
  }

  @media screen and (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
    margin: 3px;
  }
`;

export const SimpleSkillTag: React.FC<SimpleSkillTagProps> = ({
  label,
  className,
}) => {
  return <SimpleTag className={className}>{label}</SimpleTag>;
};

export default SkillBadge;
