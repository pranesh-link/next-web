import { YStack, XStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';
import { useGoals } from '../../../hooks/useGoals';
import { formatCurrency, formatPercentage } from '@next-web/shared/formatters';
import { calculateGoalProgress } from '@next-web/shared/services/finance';
import type { GoalData } from '@next-web/shared/types';

/** Savings goals screen. */
export default function GoalsScreen() {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <Container paddingTop="$8">
        <AppText>Loading goals...</AppText>
      </Container>
    );
  }

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Goals</AppText>
        {goals?.map((goal: GoalData) => {
          const progress = calculateGoalProgress(goal);
          return (
            <AppCard key={goal.id}>
              <YStack gap="$2">
                <AppText variant="subheading">{goal.name}</AppText>
                <XStack justifyContent="space-between">
                  <AppText variant="caption">Progress</AppText>
                  <AppText variant="body">{formatPercentage(progress.percentage)}</AppText>
                </XStack>
                <XStack justifyContent="space-between">
                  <AppText variant="caption">Target</AppText>
                  <AppText variant="body">{formatCurrency(goal.targetAmount)}</AppText>
                </XStack>
              </YStack>
            </AppCard>
          );
        })}
      </YStack>
    </Container>
  );
}
