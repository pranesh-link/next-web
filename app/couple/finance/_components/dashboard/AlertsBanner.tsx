"use client";

import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";
import { Section, SectionHeader } from "./DashboardClient.styled";
import type { DashboardData } from "./types";

/** Props for the {@link AlertsBanner} component. */
interface AlertsBannerProps {
  /** Array of financial alerts to display. */
  alerts: DashboardData["alerts"];
}

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AlertsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: ${slideDown} 0.4s ${EASING} both;
`;

const AlertItem = styled.div<{ $severity: "warning" | "danger" | "info" }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: ${(p) =>
    p.$severity === "danger"
      ? "rgba(239, 68, 68, 0.08)"
      : "var(--surface)"};
  border: 1px solid
    ${(p) =>
      p.$severity === "danger"
        ? "rgba(239, 68, 68, 0.2)"
        : "var(--border)"};
  transition: background 0.2s ${EASING};

  @media (max-width: 480px) {
    padding: 10px 12px;
    gap: 8px;
  }
`;

const AlertDot = styled.span<{ $severity: "warning" | "danger" | "info" }>`
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: ${(p) => {
    switch (p.$severity) {
      case "danger":
        return "var(--danger)";
      case "warning":
        return "#f59e0b";
      case "info":
        return "var(--accent)";
    }
  }};
`;

const AlertMessage = styled.span`
  flex: 1;
  font-size: 0.875rem;
  color: var(--text);
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`;

const AlertType = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 0.6875rem;
  }
`;

/**
 * Display financial alerts at the top of the dashboard.
 *
 * @param props - Component props.
 * @param props.alerts - Array of alerts to render.
 * @returns The alerts banner, or null when there are no alerts.
 */
export default function AlertsBanner({ alerts }: AlertsBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <Section>
      <SectionHeader>Alerts</SectionHeader>
      <AlertsContainer>
        {alerts.map((alert, index) => (
          <AlertItem key={index} $severity={alert.severity}>
            <AlertDot $severity={alert.severity} />
            <AlertMessage>{alert.message}</AlertMessage>
            <AlertType>{alert.severity}</AlertType>
          </AlertItem>
        ))}
      </AlertsContainer>
    </Section>
  );
}
