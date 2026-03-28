'use client';

import React from 'react';
import styled from 'styled-components';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

const Amount = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

function getColor(amount: number): string {
  if (amount > 0) return 'var(--success)';
  if (amount < 0) return 'var(--danger)';
  return 'var(--text)';
}

export default function CurrencyDisplay({
  amount,
  currency = 'INR',
  className,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const display = amount < 0 ? `-${formatted}` : formatted;

  return (
    <Amount $color={getColor(amount)} className={className}>
      {display}
    </Amount>
  );
}
