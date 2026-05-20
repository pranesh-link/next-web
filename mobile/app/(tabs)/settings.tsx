import { YStack } from 'tamagui';
import { AppText, AppButton, Container } from '@next-web/ui';
import { useAuth } from '../../providers/auth';

/** Settings screen with account info and sign-out. */
export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Settings</AppText>
        {user && (
          <YStack gap="$2">
            <AppText variant="body">{user.name}</AppText>
            <AppText variant="caption">{user.email}</AppText>
          </YStack>
        )}
        <AppButton variant="danger" onPress={signOut}>
          Sign Out
        </AppButton>
      </YStack>
    </Container>
  );
}
