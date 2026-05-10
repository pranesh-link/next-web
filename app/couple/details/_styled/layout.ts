"use client";

import styled, { keyframes } from "styled-components";

export { EASING } from "@/couple/_constants/theme";
import { EASING } from "@/couple/_constants/theme";

export const slideDown = keyframes`
  from { opacity: 0; transform: translate(-50%, -12px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`;

export const fadeOut = keyframes`
  from { opacity: 1; transform: translate(-50%, 0); }
  to   { opacity: 0; transform: translate(-50%, -12px); }
`;

export const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

export const PageWrapper = styled.div`
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);
  max-width: 100%;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const NotificationBannerEl = styled.div<{
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
  color: ${(p) => (p.$type === "success" ? "#16a34a" : "#dc2626")};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
`;

export const SkeletonCard = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
`;

export const SkeletonLine = styled.div<{ $width?: string; $height?: string }>`
  width: ${(p) => p.$width ?? "100%"};
  height: ${(p) => p.$height ?? "16px"};
  border-radius: 8px;
  background: #e5e7eb;
  animation: ${pulse} 1.5s ease-in-out infinite;

  & + & {
    margin-top: 12px;
  }
`;
