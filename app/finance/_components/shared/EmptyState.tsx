'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FinanceButton } from '@/finance/_components/theme/styled-primitives';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

const iconFadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Container = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconWrapper = styled.div`
  animation: ${iconFadeIn} 0.6s ease-out;
`;

const DefaultIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid transparent;
  background-image: linear-gradient(var(--surface), var(--surface)),
    linear-gradient(135deg, var(--border) 0%, var(--accent) 50%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 24px;
`;

const EmptyTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 16px 0 0 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  max-width: 320px;
  margin: 8px auto 0 auto;
  line-height: 1.6;
`;

const ActionButton = styled(FinanceButton)`
  margin-top: 20px;
`;

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <Container>
      <IconWrapper>
        {icon ?? (
          <DefaultIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </DefaultIcon>
        )}
      </IconWrapper>
      <EmptyTitle>{title}</EmptyTitle>
      {description && <Description>{description}</Description>}
      {action && (
        <ActionButton type="button" onClick={action.onClick}>
          {action.label}
        </ActionButton>
      )}
    </Container>
  );
}
