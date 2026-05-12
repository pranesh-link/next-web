import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";
import type { StatusColor } from "./_types";

/** Root page wrapper. */
export const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

/** Scrollable content area. */
export const ContentArea = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

/** 2-column card grid for trips. */
export const TripGrid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 20px 16px;
  }
`;

/** Individual trip card. */
export const TripCard = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;

  &:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
  }
`;

/** Card top row: emoji + status badge. */
export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24px;
`;

/** Card body: name + destination. */
export const CardBody = styled.div`
  flex: 1;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
  }
`;

/** Card footer: dates + budget. */
export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
`;

/** Small metadata text inside a card. */
export const TripMeta = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

/** Colored status pill. */
export const StatusBadge = styled.span<{ $color: StatusColor }>`
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

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

/** Empty state wrapper. */
export const EmptyWrap = styled.div`
  max-width: 1000px;
  margin: 80px auto;
  text-align: center;
  padding: 24px;

  p:first-child {
    font-size: 48px;
    margin: 0 0 16px;
  }

  p:last-child {
    font-size: 15px;
    color: var(--text-muted);
    margin: 0;
  }
`;

/** Error text row. */
export const ErrorText = styled.p`
  color: var(--danger);
  padding: 16px 24px;
  font-size: 14px;
  max-width: 1000px;
  margin: 0 auto;
`;

/** Modal backdrop. */
export const FormOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
`;

/** Modal form box. */
export const FormBox = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 20px;
  }
`;

/** Two-column form grid. */
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** Full-width form field span. */
export const FormSpan = styled.div`
  grid-column: 1 / -1;
`;

/** Generic text input. */
export const FormInput = styled.input`
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

/** Textarea for notes. */
export const FormTextarea = styled.textarea`
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
  min-height: 72px;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

/** Form action row. */
export const FormActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
`;

/** Secondary / cancel button. */
export const CancelBtn = styled.button`
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface);
    color: var(--text);
  }
`;

/** Primary submit button. */
export const SubmitBtn = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: filter 0.2s ${EASING};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
