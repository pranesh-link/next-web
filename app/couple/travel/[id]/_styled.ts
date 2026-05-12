import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";
import type { StatusColor } from "../_types";

/** Root wrapper for the detail page. */
export const DetailWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

/** Trip info section below the header. */
export const TripInfoSection = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 24px 0;
`;

/** Flex row: destination + meta on left, status + budget on right. */
export const TripInfoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 4px;
  }
`;

/** Trip date range text. */
export const TripDates = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
`;

/** Right-aligned cluster: status badge + budget. */
export const TripMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;

  span {
    font-size: 13px;
    color: var(--text-muted);
  }
`;

/** Status pill badge. */
export const StatusBadge = styled.span<{ $color: StatusColor }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;

  ${(p) => {
    const palette = {
      blue: { bg: "rgba(59,130,246,0.15)", fg: "#3b82f6" },
      green: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e" },
      amber: { bg: "rgba(245,158,11,0.15)", fg: "#f59e0b" },
      gray: { bg: "rgba(107,114,128,0.15)", fg: "#6b7280" },
      red: { bg: "rgba(239,68,68,0.15)", fg: "#ef4444" },
    };
    const c = palette[p.$color];
    return `background: ${c.bg}; color: ${c.fg};`;
  }}
`;

/** Horizontal tab bar. */
export const TabBar = styled.div`
  max-width: 900px;
  margin: 24px auto 0;
  padding: 0 24px;
  display: flex;
  border-bottom: 1px solid var(--border);
  gap: 4px;

  @media (max-width: 480px) {
    padding: 0 12px;
  }
`;

/** Individual tab button. */
export const TabBtn = styled.button<{ $active: boolean }>`
  padding: 10px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  color: ${(p) => (p.$active ? "var(--accent)" : "var(--text-muted)")};
  border-bottom: 2px solid
    ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  margin-bottom: -1px;
  transition: all 0.2s ${EASING};
  white-space: nowrap;

  &:hover {
    color: var(--accent);
  }

  @media (max-width: 480px) {
    padding: 10px 10px;
    font-size: 13px;
  }
`;

/** Tab content area. */
export const TabContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

/** Shared small input used within tab forms. */
export const TabInput = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  min-width: 0;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

/** Small accent button for adding items inline. */
export const AddItemBtn = styled.button`
  margin-top: 16px;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  width: 100%;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;

/** Inline add-form row. */
export const InlineForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  align-items: center;
`;

/** Small primary button. */
export const SmallPrimaryBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.2s ${EASING};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/** Small ghost/cancel button. */
export const SmallGhostBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface);
    color: var(--text);
  }
`;

/** Empty-state hint text. */
export const EmptyHint = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  margin: 40px 0;
`;

/** Icon-only delete button. */
export const DeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  transition: all 0.15s ${EASING};

  &:hover {
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 10%, transparent);
  }
`;
