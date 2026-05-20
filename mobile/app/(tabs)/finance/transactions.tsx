import { YStack, XStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';
import { useTransactions } from '../../../hooks/useTransactions';
import { formatCurrency, formatDate } from '@next-web/shared/formatters';
import type { TransactionData } from '@next-web/shared/types';

/** Transactions list screen. */
export default function TransactionsScreen() {
  const { data: transactions, isLoading } = useTransactions();

  if (isLoading) {
    return (
      <Container paddingTop="$8">
        <AppText>Loading transactions...</AppText>
      </Container>
    );
  }

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Transactions</AppText>
        {transactions?.map((tx: TransactionData) => (
          <AppCard key={tx.id}>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <AppText variant="body">{tx.category}</AppText>
                <AppText variant="caption">{formatDate(tx.date)}</AppText>
              </YStack>
              <AppText
                variant="body"
                color={tx.type === 'INCOME' ? '$green10' : '$red10'}
              >
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
              </AppText>
            </XStack>
          </AppCard>
        ))}
      </YStack>
    </Container>
  );
}
