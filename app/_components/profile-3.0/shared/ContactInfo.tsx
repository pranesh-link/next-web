"use client";
import React, { useState } from "react";
import styled from "styled-components";

const ContactInfoContainer = styled.div<{ $index: number }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--surface-hover);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.2);
    background: var(--surface);
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
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 15px;
  color: var(--text);
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
    props.$copied ? "rgba(34, 211, 238, 0.15)" : "var(--surface-hover)"};
  border: 1px solid
    ${(props) =>
      props.$copied ? "rgba(34, 211, 238, 0.3)" : "var(--border)"};
  color: ${(props) => (props.$copied ? "#22d3ee" : "var(--text-dim)")};
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
    color: var(--text);
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
