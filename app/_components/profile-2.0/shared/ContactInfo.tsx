"use client";
import React from "react";
import styled from "styled-components";

/**
 * ContactInfo Component
 * Displays contact information with icons
 * Features: Copy-to-clipboard functionality, animated icons
 */

interface ContactInfoProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  canCopy?: boolean;
  href?: string;
  className?: string;
}

const InfoContainer = styled.div<{ $clickable: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(55, 65, 81, 0.1);
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(55, 65, 81, 0.1), transparent);
    transition: left 0.5s;
  }

  ${(props) =>
    props.$clickable &&
    `
    &:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(55, 65, 81, 0.3);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    &:hover::before {
      left: 100%;
    }
  `}

  @media screen and (max-width: 768px) {
    padding: 12px;
    gap: 12px;
  }
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 12px;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(55, 65, 81, 0.25);
  transition: transform 0.3s ease;

  ${InfoContainer}:hover & {
    transform: scale(1.1) rotate(5deg);
  }

  @media screen and (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px;
    font-size: 18px;
  }
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;

  @media screen and (max-width: 768px) {
    font-size: 12px;
  }
`;

const InfoValue = styled.div`
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const CopyIndicator = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  background: #10b981;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  transition: opacity 0.3s ease;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
`;

export const ContactInfo: React.FC<ContactInfoProps> = ({
  icon,
  label,
  value,
  canCopy = false,
  href,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleClick = () => {
    if (canCopy) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (href) {
      window.open(href, "_blank");
    }
  };

  const isClickable = canCopy || !!href;

  const content = (
    <InfoContainer
      $clickable={isClickable}
      onClick={isClickable ? handleClick : undefined}
      className={className}
    >
      <IconContainer>{icon}</IconContainer>
      <InfoContent>
        <InfoLabel>{label}</InfoLabel>
        <InfoValue>{value}</InfoValue>
      </InfoContent>
      {canCopy && <CopyIndicator $show={copied}>Copied!</CopyIndicator>}
    </InfoContainer>
  );

  return content;
};

export default ContactInfo;
