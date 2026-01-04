"use client";
import React from "react";
import {
  InfoContainer,
  IconContainer,
  InfoContent,
  InfoLabel,
  InfoValue,
  CopyIndicator,
} from "./ContactInfoElements";

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
