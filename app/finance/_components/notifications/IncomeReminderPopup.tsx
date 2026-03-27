"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { useNotifications } from "./NotificationProvider";

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const AUTO_DISMISS_MS = 10_000;

const slideIn = keyframes`
  from {
    transform: translateY(-24px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-24px);
    opacity: 0;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
`;

const PopupContainer = styled.div<{ $leaving: boolean }>`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  pointer-events: auto;
  animation: ${(p) => (p.$leaving ? slideOut : slideIn)} 0.35s ${EASING} forwards;
  width: min(420px, calc(100vw - 32px));

  @media (max-width: 768px) {
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const Card = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 480px) {
    padding: 16px 18px;
    gap: 12px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const IconCircle = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(251, 191, 36, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
  line-height: 1.3;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  background: ${(p) => (p.$primary ? "var(--accent)" : "var(--surface)")};
  color: ${(p) => (p.$primary ? "#ffffff" : "var(--text-muted)")};

  &:hover {
    background: ${(p) => (p.$primary ? "var(--accent)" : "var(--surface)")};
    opacity: 0.85;
  }
`;

const ProgressBar = styled.div`
  height: 3px;
  border-radius: 2px;
  background: var(--surface);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $duration: number }>`
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  animation: shrink ${(p) => p.$duration}ms linear forwards;

  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

export default function IncomeReminderPopup() {
  const { incomePopup, dismissIncomePopup } = useNotifications();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!incomePopup) return;

    timerRef.current = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        dismissIncomePopup();
        setLeaving(false);
      }, 350);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [incomePopup, dismissIncomePopup]);

  if (!incomePopup) return null;

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => {
      dismissIncomePopup();
      setLeaving(false);
    }, 350);
  };

  const handleAddIncome = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dismissIncomePopup();
    router.push("/finance/accounts?addIncome=true");
  };

  return (
    <Overlay>
      <PopupContainer $leaving={leaving}>
        <Card>
          <Header>
            <IconCircle>💰</IconCircle>
            <TextBlock>
              <Title>Record your income</Title>
              <Subtitle>
                Have you recorded your income for {incomePopup.month}?
              </Subtitle>
            </TextBlock>
          </Header>
          <ProgressBar>
            <ProgressFill $duration={AUTO_DISMISS_MS} />
          </ProgressBar>
          <ButtonRow>
            <Button onClick={handleDismiss}>Dismiss</Button>
            <Button $primary onClick={handleAddIncome}>
              Add Income
            </Button>
          </ButtonRow>
        </Card>
      </PopupContainer>
    </Overlay>
  );
}
