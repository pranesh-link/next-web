import { YStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';
import { useFinanceDashboard } from '../../../hooks/useFinanceDashboard';

/** Finance dashboard showing accounts, cash flow, and health score. */
export default function FinanceDashboardScreen() {
  const { data, isLoading } = useFinanceDashboard();

  if (isLoading) {
    return (
      <Container paddingTop="$8">
        <AppText>Loading...</AppText>
      </Container>
    );
  }

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Finance</AppText>
        <AppCard>
          <AppText variant="subheading">Health Score</AppText>
          <AppText variant="body">{data?.healthScore?.overallScore ?? '—'}/100</AppText>
        </AppCard>
        <AppCard>
          <AppText variant="subheading">Cash Flow</AppText>
          <AppText variant="body">
            Income: ₹{data?.cashFlow?.income?.toLocaleString() ?? '0'}
          </AppText>
          <AppText variant="body">
            Expenses: ₹{data?.cashFlow?.expenses?.toLocaleString() ?? '0'}
          </AppText>
        </AppCard>
      </YStack>
    </Container>
  );
}
