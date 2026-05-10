"use client";

import { EmptyState } from "./_TransactionTable/EmptyState";
import { RowActions } from "./_TransactionTable/RowActions";
import { formatCurrency, formatDate } from "./_TransactionTable/utils";
import {
  AccountName,
  Amount,
  CategoryBadge,
  DateText,
  Description,
  MobileCard,
  MobileList,
  MobileMeta,
  MobileRow,
  ScrollContainer,
  Table,
  TRow,
  Td,
  THead,
  Th,
  Wrapper,
} from "./_TransactionTable/styled";

/** A single transaction row rendered by {@link TransactionTable}. */
interface Transaction {
  /** Transaction id. */
  id: string;
  /** Signed amount; sign convention is determined by `type`. */
  amount: number;
  /** Whether this is income or an expense. */
  type: "INCOME" | "EXPENSE";
  /** Display category. */
  category: string;
  /** Description. */
  description: string;
  /** ISO date string. */
  date: string;
  /** Optional account name shown beneath the description. */
  accountName?: string;
}

/** Props for {@link TransactionTable}. */
interface TransactionTableProps {
  /** Transactions to render. */
  transactions: Transaction[];
  /** Optional edit handler; when omitted the edit action is hidden. */
  onEdit?: (id: string) => void;
  /** Optional delete handler; when omitted the delete action is hidden. */
  onDelete?: (id: string) => void;
}

/**
 * Render a list of transactions as a desktop table or mobile card stack.
 *
 * @param props - See {@link TransactionTableProps}.
 */
export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const hasActions = Boolean(onEdit || onDelete);

  if (transactions.length === 0) {
    return <EmptyState />;
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
                    {txn.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Math.abs(txn.amount))}
                  </Amount>
                </Td>
                {hasActions && (
                  <Td $align="right">
                    <RowActions
                      id={txn.id}
                      description={txn.description}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
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
                {txn.type === "INCOME" ? "+" : "-"}
                {formatCurrency(Math.abs(txn.amount))}
              </Amount>
            </MobileRow>
            <MobileRow>
              <MobileMeta>
                <CategoryBadge>{txn.category}</CategoryBadge>
                <DateText>{formatDate(txn.date)}</DateText>
              </MobileMeta>
              {hasActions && (
                <RowActions
                  id={txn.id}
                  description={txn.description}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )}
            </MobileRow>
            {txn.accountName && <AccountName>{txn.accountName}</AccountName>}
          </MobileCard>
        ))}
      </MobileList>
    </Wrapper>
  );
}
