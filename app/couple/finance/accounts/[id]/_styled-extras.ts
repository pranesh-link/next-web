"use client";

/**
 * Styled atoms for the account detail header badges, danger zone, and
 * not-found placeholder.
 *
 * Groups the EmergencyBadge / NicknameBadge / HeaderBadges row, PinToggle,
 * DangerZone delete row, and the not-found view wrapper plus its icon and
 * text. Imported through `_styled.ts` for consistency.
 */

import styled from "styled-components";
import { EASING } from "./_utils";

export const EmergencyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: rgba(34, 197, 94, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
`;

export const NicknameBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
`;

export const HeaderBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

export const PinToggle = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  color: var(--text-muted);

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;

export const DangerZone = styled.div`
  background: var(--bg-elevated);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }
`;

export const DangerText = styled.div`
  font-size: 13px;
  color: var(--text-muted);
`;

export const NotFoundWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 12px;
`;

export const NotFoundIcon = styled.div`
  font-size: 48px;
`;

export const NotFoundTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
`;

export const NotFoundSub = styled.div`
  font-size: 14px;
  color: var(--text-muted);
`;
