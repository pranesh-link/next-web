'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

/** Toast notification types. */
export type ToastType = 'success' | 'error' | 'info';

/** Shape of a single toast item. */
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const colorMap: Record<ToastType, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--accent)',
};

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const Container = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;

  @media (max-width: 768px) {
    bottom: 16px;
    right: 16px;
    left: 16px;
  }
`;

const ToastWrapper = styled.div<{ $type: ToastType; $exiting?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid ${(p) => colorMap[p.$type]};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  animation: ${(p) => (p.$exiting ? slideOut : slideIn)} 0.3s ease-out forwards;
  pointer-events: auto;
  max-width: 380px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const IconCircle = styled.span<{ $type: ToastType }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${(p) => colorMap[p.$type]};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
`;

const Message = styled.span`
  font-size: 14px;
  color: var(--text);
  flex: 1;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    color: var(--text);
  }
`;

/** Props for a single Toast element. */
interface ToastProps {
  item: ToastItem;
  onClose: (id: string) => void;
}

/**
 * A single toast notification with slide-in animation,
 * colored icon, and close button.
 */
export default function Toast({ item, onClose }: ToastProps) {
  return (
    <ToastWrapper $type={item.type}>
      <IconCircle $type={item.type}>{iconMap[item.type]}</IconCircle>
      <Message>{item.message}</Message>
      <CloseButton onClick={() => onClose(item.id)} aria-label="Close">
        ✕
      </CloseButton>
    </ToastWrapper>
  );
}

/** Container component for rendering a stack of toasts. */
export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  return (
    <Container>
      {toasts.map((toast) => (
        <Toast key={toast.id} item={toast} onClose={onClose} />
      ))}
    </Container>
  );
}
