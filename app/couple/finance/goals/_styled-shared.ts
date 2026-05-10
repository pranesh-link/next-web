"use client";

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

export const ringDraw = keyframes`
  from { stroke-dashoffset: var(--ring-circumference); }
`;

export const sparkle = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.2), inset 0 0 12px rgba(34, 197, 94, 0.05); }
  50% { box-shadow: 0 0 24px rgba(34, 197, 94, 0.35), inset 0 0 20px rgba(34, 197, 94, 0.08); }
`;

export const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
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
        ? "rgba(34, 197, 94, 0.4)"
        : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) =>
    p.$type === "success" ? "var(--success)" : "var(--danger)"};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
  pointer-events: none;
`;

export const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
`;
