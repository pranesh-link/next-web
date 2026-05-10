"use client";

/**
 * Public styled-component entry point for the accounts list page.
 *
 * Houses keyframes and layout/total-bar atoms; re-exports cards, modal, and
 * history atoms from the sibling `_styled-*.ts` files so existing
 * `from "./_styled"` imports continue to work after the split.
 */

import styled, { keyframes } from "styled-components";
import { EASING } from "./_utils";

export const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

export const Content = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px;

  @media (max-width: 480px) {
    padding: 16px 12px;
  }
`;

export const NotificationBanner = styled.div<{
  $type: "success" | "error";
  $leaving: boolean;
}>`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: ${(p) =>
    p.$type === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  border: 1px solid
    ${(p) =>
      p.$type === "success"
        ? "rgba(34, 197, 94, 0.3)"
        : "rgba(239, 68, 68, 0.3)"};
  color: ${(p) => (p.$type === "success" ? "#16a34a" : "#dc2626")};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
`;

export const TotalBar = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
  }
`;

export const TotalLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

export const TotalAmount = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

export const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export * from "./_styled-card";
export * from "./_styled-modal";
export * from "./_styled-history";
