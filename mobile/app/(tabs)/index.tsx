import { YStack } from 'tamagui';
import { AppText, Container } from '@next-web/ui';

/** Home dashboard screen. */
export default function HomeScreen() {
  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Welcome back</AppText>
        <AppText variant="body" muted>Your LuvVerse dashboard</AppText>
      </YStack>
    </Container>
  );
}
