import { YStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';

/** Lifestyle dashboard screen. */
export default function LifestyleScreen() {
  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Lifestyle</AppText>
        <AppCard>
          <AppText variant="subheading">Body Metrics</AppText>
          <AppText variant="body" muted>Track weight, BMI, and more</AppText>
        </AppCard>
        <AppCard>
          <AppText variant="subheading">BMI Calculator</AppText>
          <AppText variant="body" muted>Quick BMI check</AppText>
        </AppCard>
      </YStack>
    </Container>
  );
}
