import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

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

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const UnreadBadge = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  padding: 4px 12px;
  border-radius: 12px;
`;

export const MarkAllButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const NotificationCard = styled.div<{ $unread: boolean }>`
  background: ${(p) => (p.$unread ? "var(--bg-elevated)" : "var(--bg)")};
  border: 1px solid ${(p) => (p.$unread ? "var(--accent)" : "var(--border)")};
  border-left: 3px solid ${(p) => (p.$unread ? "var(--accent)" : "transparent")};
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.2s ${EASING};
  cursor: pointer;

  &:hover {
    background: var(--surface);
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

export const IconCircle = styled.div<{ $type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$type === "COUPLE_INVITE"
      ? "rgba(59, 130, 246, 0.12)"
      : p.$type === "INCOME_REMINDER"
      ? "rgba(251, 191, 36, 0.15)"
      : "var(--surface)"};
`;

export const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const CardTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 2px;
  line-height: 1.4;
`;

export const CardMeta = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
`;

export const ReadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  margin-top: 6px;
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-left: 52px;

  @media (max-width: 480px) {
    padding-left: 0;
  }
`;

export const ActionButton = styled.button<{ $variant: "accept" | "decline" }>`
  padding: 8px 20px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
