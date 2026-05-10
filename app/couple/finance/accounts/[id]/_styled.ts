"use client";

/**
 * Public styled-component entry point for the account detail page.
 *
 * Houses keyframes, layout, header, sections, badges, danger zone, and
 * not-found atoms; re-exports modal and history atoms from sibling
 * `_styled-*.ts` files so existing `from "./_styled"` imports keep working.
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
  max-width: 720px;
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

export const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ${EASING};

  &:hover {
    color: var(--accent);
  }
`;

export const AccountHeader = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

export const AccountTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const IconCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
`;

export const AccountMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

export const AccountName = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const AccountType = styled.div`
  font-size: 13px;
  color: var(--text-muted);
`;

export const BalanceDisplay = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 26px;
  }
`;

export const BalanceSub = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

export const Section = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

export const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
`;

export const SmallButton = styled.button<{ $variant?: "danger" | "primary" }>`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;
  background: ${(p) =>
    p.$variant === "danger"
      ? "rgba(239, 68, 68, 0.1)"
      : p.$variant === "primary"
        ? "var(--accent)"
        : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "danger"
      ? "#ef4444"
      : p.$variant === "primary"
        ? "#ffffff"
        : "var(--text)"};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export * from "./_styled-modal";
export * from "./_styled-history";
export * from "./_styled-extras";
