import { YStack, XStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';
import { useBudgets } from '../../../hooks/useBudgets';
import { formatCurrency } from '@next-web/shared/formatters';
import type { BudgetData } from '@next-web/shared/types';

/** Budgets overview screen. */
export default function BudgetsScreen() {
  const { data: budgets, isLoading } = useBudgets();

  if (isLoading) {
    return (
      <Container paddingTop="$8">
        <AppText>Loading budgets...</AppText>
      </Container>
    );
  }

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Budgets</AppText>
        {budgets?.map((budget: BudgetData) => (
          <AppCard key={budget.id}>
            <XStack justifyContent="space-between" alignItems="center">
              <AppText variant="body">{budget.category}</AppText>
              <AppText variant="body">{formatCurrency(budget.limit)}</AppText>
            </XStack>
          </AppCard>
        ))}
      </YStack>
    </Container>
  );
}
