import { YStack } from 'tamagui';
import { AppText, AppButton, Container } from '@next-web/ui';
import { useAuth } from '../../providers/auth';

/** Login screen with Google OAuth. */
export default function LoginScreen() {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <Container paddingTop="$20">
      <YStack gap="$6" alignItems="center">
        <AppText variant="heading" center>LuvVerse</AppText>
        <AppText variant="body" muted center>
          Manage finances together
        </AppText>
        <AppButton
          variant="primary"
          fullWidth
          onPress={signInWithGoogle}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </AppButton>
      </YStack>
    </Container>
  );
}
