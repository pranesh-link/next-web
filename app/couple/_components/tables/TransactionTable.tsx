'use client';

import styled from 'styled-components';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
  accountName?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/* ── Styled Components ──────────────────────────────── */

const Wrapper = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
`;

const ScrollContainer = styled.div`
  overflow-x: auto;

  @media screen and (max-width: 480px) {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const THead = styled.thead`
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
`;

const Th = styled.th<{ $align?: string }>`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  padding: 14px 16px;
  text-align: ${(p) => p.$align || 'left'};
  white-space: nowrap;
`;

const TRow = styled.tr`
  border-bottom: 1px solid var(--border);
  transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--surface-hover);
  }
`;

const Td = styled.td<{ $align?: string }>`
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text-dim);
  text-align: ${(p) => p.$align || 'left'};
  white-space: nowrap;
`;

const Description = styled.p`
  color: var(--text);
  font-weight: 500;
  font-size: 14px;
  margin: 0;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AccountName = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 2px 0 0 0;
`;

const DateText = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

const Amount = styled.span<{ $type: 'INCOME' | 'EXPENSE' }>`
  font-weight: 700;
  font-size: 14px;
  color: ${(p) => (p.$type === 'INCOME' ? '#22c55e' : '#ef4444')};
`;

const CategoryBadge = styled.span`
  display: inline-block;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-light);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
`;

const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`;

const ActionButton = styled.button<{ $variant: 'edit' | 'delete' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: var(--surface-hover);
    color: ${(p) =>
      p.$variant === 'edit' ? 'var(--accent)' : 'var(--danger)'};
  }
`;

/* ── Mobile Card Layout ─────────────────────────────── */

const MobileList = styled.div`
  display: none;

  @media screen and (max-width: 480px) {
    display: flex;
    flex-direction: column;
  }
`;

const MobileCard = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--surface-hover);
  }
`;

const MobileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MobileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/* ── Empty State ────────────────────────────────────── */

const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  gap: 8px;
`;

const EmptyIcon = styled.svg`
  width: 40px;
  height: 40px;
  color: var(--text-muted);
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: var(--text-dim);
  margin: 0;
`;

const AddButton = styled.button`
  margin-top: 4px;
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-light);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.08);
  }
`;

/* ── Helpers ─────────────────────────────────────────── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ── Component ──────────────────────────────────────── */

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const hasActions = Boolean(onEdit || onDelete);

  if (transactions.length === 0) {
    return (
      <Wrapper>
        <EmptyWrapper>
          <EmptyIcon
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </EmptyIcon>
          <EmptyText>No transactions yet</EmptyText>
          <AddButton type="button">Add your first transaction</AddButton>
        </EmptyWrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* Desktop / Tablet table */}
      <ScrollContainer>
        <Table>
          <THead>
            <tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th $align="right">Amount</Th>
              {hasActions && <Th $align="right">Actions</Th>}
            </tr>
          </THead>
          <tbody>
            {transactions.map((txn) => (
              <TRow key={txn.id}>
                <Td>
                  <DateText>{formatDate(txn.date)}</DateText>
                </Td>
                <Td>
                  <Description>{txn.description}</Description>
                  {txn.accountName && (
                    <AccountName>{txn.accountName}</AccountName>
                  )}
                </Td>
                <Td>
                  <CategoryBadge>{txn.category}</CategoryBadge>
                </Td>
                <Td $align="right">
                  <Amount $type={txn.type}>
                    {txn.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Math.abs(txn.amount))}
                  </Amount>
                </Td>
                {hasActions && (
                  <Td $align="right">
                    <ActionsCell>
                      {onEdit && (
                        <ActionButton
                          $variant="edit"
                          type="button"
                          onClick={() => onEdit(txn.id)}
                          aria-label={`Edit transaction: ${txn.description}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </ActionButton>
                      )}
                      {onDelete && (
                        <ActionButton
                          $variant="delete"
                          type="button"
                          onClick={() => onDelete(txn.id)}
                          aria-label={`Delete transaction: ${txn.description}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </ActionButton>
                      )}
                    </ActionsCell>
                  </Td>
                )}
              </TRow>
            ))}
          </tbody>
        </Table>
      </ScrollContainer>

      {/* Mobile card layout */}
      <MobileList>
        {transactions.map((txn) => (
          <MobileCard key={txn.id}>
            <MobileRow>
              <Description>{txn.description}</Description>
              <Amount $type={txn.type}>
                {txn.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(Math.abs(txn.amount))}
              </Amount>
            </MobileRow>
            <MobileRow>
              <MobileMeta>
                <CategoryBadge>{txn.category}</CategoryBadge>
                <DateText>{formatDate(txn.date)}</DateText>
              </MobileMeta>
              {hasActions && (
                <ActionsCell>
                  {onEdit && (
                    <ActionButton
                      $variant="edit"
                      type="button"
                      onClick={() => onEdit(txn.id)}
                      aria-label={`Edit transaction: ${txn.description}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </ActionButton>
                  )}
                  {onDelete && (
                    <ActionButton
                      $variant="delete"
                      type="button"
                      onClick={() => onDelete(txn.id)}
                      aria-label={`Delete transaction: ${txn.description}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </ActionButton>
                  )}
                </ActionsCell>
              )}
            </MobileRow>
            {txn.accountName && <AccountName>{txn.accountName}</AccountName>}
          </MobileCard>
        ))}
      </MobileList>
    </Wrapper>
  );
}
