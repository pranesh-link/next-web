"use client";
import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const PromptContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 24px 40px;
`;

const PromptButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: transparent;
  border: 1px dashed var(--border-strong);
  border-radius: 32px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.2px;

  &:hover {
    border-style: solid;
    border-color: rgba(59, 130, 246, 0.4);
    color: var(--accent-light);
    background: rgba(59, 130, 246, 0.04);
    transform: translateY(-2px);
  }

  @media screen and (max-width: 480px) {
    font-size: 13px;
    padding: 10px 20px;
    gap: 8px;
  }
`;

const Arrow = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  background: linear-gradient(
    90deg,
    var(--text-muted) 0%,
    var(--accent-light) 50%,
    var(--text-muted) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${shimmer} 3s linear infinite;

  ${PromptButton}:hover & {
    transform: translateX(4px);
  }
`;

interface SectionPromptProps {
  text: string;
  targetSection: string;
}

const SectionPrompt: React.FC<SectionPromptProps> = ({
  text,
  targetSection,
}) => {
  const handleClick = () => {
    const el = document.getElementById(targetSection);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PromptContainer>
      <PromptButton onClick={handleClick}>
        {text}
        <Arrow>→</Arrow>
      </PromptButton>
    </PromptContainer>
  );
};

export default SectionPrompt;
