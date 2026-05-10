"use client";

import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

export const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
`;

export const SummaryLabel = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const SummaryValue = styled.p<{ $danger?: boolean }>`
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text)")};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s ${EASING};

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
    transform: translateY(-1px);
  }
`;

export const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

export const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: var(--text);
`;

export const BadgeRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

export const Badge = styled.span`
  font-size: 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 8px;
  color: var(--text-muted);
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-dim);
`;

export const Value = styled.span<{ $good?: boolean; $bad?: boolean }>`
  color: ${(p) => (p.$good ? "var(--success)" : p.$bad ? "var(--danger)" : "var(--text)")};
  font-weight: 600;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

export const Button = styled.button<{ $variant?: "danger" | "ghost" }>`
  border: 1px solid ${(p) => (p.$variant === "danger" ? "rgba(239,68,68,0.4)" : "var(--border)")};
  background: ${(p) => (p.$variant === "ghost" ? "transparent" : "var(--surface)")};
  color: ${(p) => (p.$variant === "danger" ? "var(--danger)" : "var(--text-muted)")};
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
`;

export const Input = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
`;

export const Select = styled.select`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
`;

export const FormActions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const ErrorText = styled.p`
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 12px;
`;

export const PrimaryButton = styled.button`
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
`;
