"use client";

import { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideDown = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ $show: boolean }>`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: ${(p) => (p.$show ? slideUp : slideDown)} 0.3s ${EASING} forwards;

  @media (max-width: 480px) {
    bottom: 16px;
    left: 16px;
    right: 16px;
    transform: none;
  }
`;

const ToastContent = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;

  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
  }
`;

const ToastIcon = styled.span`
  font-size: 20px;
`;

const ToastMessage = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  flex: 1;
`;

const UndoButton = styled.button`
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover {
    background: #2563eb;
  }

  &:active {
    transform: scale(0.95);
  }
`;

interface ToastProps {
  message: string;
  icon?: string;
  show: boolean;
  onUndo?: () => void;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({
  message,
  icon = "✓",
  show,
  onUndo,
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <ToastContainer $show={show}>
      <ToastContent>
        <ToastIcon>{icon}</ToastIcon>
        <ToastMessage>{message}</ToastMessage>
        {onUndo && <UndoButton onClick={onUndo}>Undo</UndoButton>}
      </ToastContent>
    </ToastContainer>
  );
}
