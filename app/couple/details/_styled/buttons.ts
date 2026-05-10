"use client";

import styled from "styled-components";

export const SmallButton = styled.button<{ $variant?: "primary" | "ghost" }>`
  background: ${(p) => (p.$variant === "primary" ? "#3b82f6" : "transparent")};
  color: ${(p) => (p.$variant === "primary" ? "#ffffff" : "#64748b")};
  border: ${(p) =>
    p.$variant === "primary" ? "none" : "1px solid #d1d5db"};
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$variant === "primary" ? "#2563eb" : "#f1f5f9")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const OutlineButton = styled.button`
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DangerButton = styled.button`
  background: #dc2626;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const CancelButton = styled.button<{ $tone?: "danger" | "info" }>`
  background: none;
  border: 1px solid
    ${(p) => (p.$tone === "info" ? "#93c5fd" : "#fca5a5")};
  color: ${(p) => (p.$tone === "info" ? "#2563eb" : "#dc2626")};
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$tone === "info"
        ? "rgba(59, 130, 246, 0.08)"
        : "rgba(239, 68, 68, 0.08)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Outline button styled with danger (red) text and border. */
export const DangerOutlineButton = styled(OutlineButton)`
  color: #dc2626;
  border-color: #fca5a5;

  &:hover:not(:disabled) {
    border-color: #f87171;
  }
`;

/** {@link PrimaryButton} variant that prevents text wrapping. */
export const NoWrapPrimaryButton = styled(PrimaryButton)`
  white-space: nowrap;
`;
