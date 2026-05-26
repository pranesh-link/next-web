import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
`;

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

export const PageHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);

  @media (max-width: 480px) {
    padding: 12px 16px;
  }
`;

export const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

export const RefreshButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }
`;

export const Content = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;

  @media (max-width: 480px) {
    padding: 16px 12px;
  }
`;

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

export const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const FilterToggle = styled.div`
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
`;

export const FilterOption = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#ffffff" : "var(--text-muted)")};
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  min-width: 60px;

  &:hover {
    background: ${(p) => (p.$active ? "var(--accent)" : "rgba(0, 0, 0, 0.04)")};
    color: ${(p) => (p.$active ? "#ffffff" : "var(--text)")};
  }

  @media (hover: none) {
    /* Touch devices */
    min-height: 36px;
  }
`;

export const UnreadBadge = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  padding: 4px 12px;
  border-radius: 12px;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const MarkAllButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s ${EASING};
  white-space: nowrap;

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (hover: none) {
    min-height: 44px;
    padding: 8px 16px;
  }
`;

export const SectionHeader = styled.div`
  position: sticky;
  top: 65px;
  z-index: 10;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 12px 0;
  margin: 20px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:first-child {
    margin-top: 0;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`;

export const SectionCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  padding: 2px 8px;
  border-radius: 10px;
`;

export const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  & > * {
    animation: fadeIn 0.3s ${EASING} both;
  }

  @for $i from 1 through 20 {
    & > *:nth-child(#{$i}) {
      animation-delay: #{$i * 0.03}s;
    }
  }

  & > *:nth-child(1) { animation-delay: 0.03s; }
  & > *:nth-child(2) { animation-delay: 0.06s; }
  & > *:nth-child(3) { animation-delay: 0.09s; }
  & > *:nth-child(4) { animation-delay: 0.12s; }
  & > *:nth-child(5) { animation-delay: 0.15s; }
  & > *:nth-child(6) { animation-delay: 0.18s; }
  & > *:nth-child(7) { animation-delay: 0.21s; }
  & > *:nth-child(8) { animation-delay: 0.24s; }
  & > *:nth-child(9) { animation-delay: 0.27s; }
  & > *:nth-child(10) { animation-delay: 0.30s; }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const NotificationCard = styled.div<{ $unread: boolean; $clickable: boolean }>`
  position: relative;
  background: ${(p) => 
    p.$unread
      ? "linear-gradient(to right, rgba(59, 130, 246, 0.04), var(--bg-elevated))"
      : "var(--bg)"
  };
  border: 1px solid ${(p) => (p.$unread ? "var(--accent)" : "var(--border)")};
  border-left: 6px solid ${(p) => (p.$unread ? "var(--accent)" : "transparent")};
  border-radius: 12px;
  padding: 16px 20px;
  min-height: 76px;
  transition: all 0.3s ${EASING};
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  opacity: ${(p) => (p.$unread ? 1 : 0.68)};

  &:hover {
    background: ${(p) => 
      p.$unread
        ? "rgba(59, 130, 246, 0.06)"
        : "var(--surface)"
    };
    opacity: ${(p) => (p.$unread ? 1 : 0.75)};
    ${(p) => p.$clickable && `
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    `}
  }

  &:active {
    ${(p) => p.$clickable && `
      transform: scale(0.98);
    `}
  }

  @media (max-width: 480px) {
    padding: 14px 16px;
    min-height: 72px;
  }

  @media (hover: none) {
    /* Touch-specific styles */
    min-height: 80px;
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

export const IconCircle = styled.div<{ $type: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$type === "COUPLE_INVITE"
      ? "rgba(59, 130, 246, 0.12)"
      : p.$type === "INCOME_REMINDER"
      ? "rgba(251, 191, 36, 0.15)"
      : p.$type === "BUDGET_ALERT"
      ? "rgba(239, 68, 68, 0.12)"
      : p.$type === "SIP_REMINDER"
      ? "rgba(34, 197, 94, 0.12)"
      : p.$type === "DEPOSIT_REMINDER"
      ? "rgba(168, 85, 247, 0.12)"
      : "var(--surface)"};

  @media (hover: none) {
    /* Larger touch target on mobile */
    width: 48px;
    height: 48px;
    font-size: 22px;
  }
`;

export const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const CardTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
  line-height: 1.4;

  @media (hover: none) {
    font-size: 15px;
  }
`;

export const CardMeta = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;

  @media (hover: none) {
    font-size: 13px;
  }
`;

export const ReadDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  margin-top: 4px;
  animation: ${pulse} 2s ease-in-out infinite;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);

  @media (hover: none) {
    width: 14px;
    height: 14px;
  }
`;

export const ArchiveButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ${EASING};

  ${NotificationCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--surface);
    color: var(--text);
    border-color: var(--accent);
  }

  &:active {
    transform: scale(0.9);
  }

  @media (hover: none) {
    /* Always visible on touch devices */
    opacity: 1;
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-left: 56px;

  @media (max-width: 480px) {
    padding-left: 0;
    margin-top: 14px;
  }
`;

export const ActionButton = styled.button<{ $variant: "accept" | "decline" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  background: ${(p) =>
    p.$variant === "accept" ? "#3b82f6" : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "accept" ? "#ffffff" : "var(--text-muted)"};

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$variant === "accept" ? "#2563eb" : "var(--surface-hover)"};
    color: ${(p) =>
      p.$variant === "accept" ? "#ffffff" : "var(--text)"};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (hover: none) {
    min-height: 44px;
    padding: 12px 28px;
    font-size: 14px;
  }
`;

export const ArchivedSection = styled.div`
  margin-top: 40px;
  padding-top: 24px;
  border-top: 2px solid var(--border);
`;

export const ArchivedHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const ArchivedTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

export const ViewArchivedButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }
`;

export const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
  
  &::before {
    content: "🎉";
    display: block;
    font-size: 48px;
    margin-bottom: 12px;
  }
`;
