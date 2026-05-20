import { YStack, XStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';
import { useLoans } from '../../../hooks/useLoans';
import { formatCurrency } from '@next-web/shared/formatters';
import type { LoanData } from '@next-web/shared/types';

/** Loans list screen. */
export default function LoansScreen() {
  const { data: loans, isLoading } = useLoans();

  if (isLoading) {
    return (
      <Container paddingTop="$8">
        <AppText>Loading loans...</AppText>
      </Container>
    );
  }

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Loans</AppText>
        {loans?.map((loan: LoanData) => (
          <AppCard key={loan.id}>
            <YStack gap="$2">
              <AppText variant="subheading">{loan.name}</AppText>
              <XStack justifyContent="space-between">
                <AppText variant="caption">EMI</AppText>
                <AppText variant="body">{formatCurrency(loan.emiAmount)}</AppText>
              </XStack>
              <XStack justifyContent="space-between">
                <AppText variant="caption">Remaining</AppText>
                <AppText variant="body">{formatCurrency(loan.remainingBalance)}</AppText>
              </XStack>
            </YStack>
          </AppCard>
        ))}
      </YStack>
    </Container>
  );
}
