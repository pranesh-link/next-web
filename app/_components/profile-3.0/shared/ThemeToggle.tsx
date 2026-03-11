"use client";
import React from "react";
import styled from "styled-components";

const ToggleButton = styled.button<{ $isDark: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid
    ${(props) =>
      props.$isDark ? "var(--border-strong)" : "rgba(0, 0, 0, 0.1)"};
  background: ${(props) =>
    props.$isDark ? "var(--border)" : "rgba(0, 0, 0, 0.05)"};
  backdrop-filter: blur(12px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: ${(props) =>
    props.$isDark
      ? "0 4px 16px rgba(0, 0, 0, 0.3)"
      : "0 4px 16px rgba(0, 0, 0, 0.1)"};

  &:hover {
    transform: scale(1.1);
    border-color: ${(props) =>
      props.$isDark ? "rgba(59, 130, 246, 0.5)" : "rgba(59, 130, 246, 0.3)"};
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }

  @media screen and (max-width: 968px) {
    top: 16px;
    right: 70px;
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    top: 14px;
    right: 60px;
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => (
  <ToggleButton
    $isDark={isDark}
    onClick={onToggle}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  >
    {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
  </ToggleButton>
);

export default ThemeToggle;
