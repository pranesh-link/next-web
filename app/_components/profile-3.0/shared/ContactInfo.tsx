"use client";
import React, { useState } from "react";
import styled from "styled-components";

const ContactInfoContainer = styled.div<{ $index: number }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.2);
    background: rgba(255, 255, 255, 0.04);
  }

  @media screen and (max-width: 768px) {
    padding: 12px;
    gap: 12px;
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
  font-size: 18px;

  @media screen and (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 15px;
  color: #e5e5e5;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  background: ${(props) =>
    props.$copied ? "rgba(34, 211, 238, 0.15)" : "rgba(255, 255, 255, 0.05)"};
  border: 1px solid
    ${(props) =>
      props.$copied ? "rgba(34, 211, 238, 0.3)" : "rgba(255, 255, 255, 0.1)"};
  color: ${(props) => (props.$copied ? "#22d3ee" : "#a1a1aa")};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #e5e5e5;
  }
`;

interface DarkContactInfoProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  canCopy?: boolean;
  index: number;
}

const DarkContactInfo: React.FC<DarkContactInfoProps> = ({
  icon,
  label,
  value,
  canCopy,
  index,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ContactInfoContainer $index={index}>
      <IconWrapper>{icon}</IconWrapper>
      <InfoContent>
        <Label>{label}</Label>
        <Value>{value}</Value>
      </InfoContent>
      {canCopy && (
        <CopyButton $copied={copied} onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </CopyButton>
      )}
    </ContactInfoContainer>
  );
};

export default DarkContactInfo;
