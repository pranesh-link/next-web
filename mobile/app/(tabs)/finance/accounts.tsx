import { YStack, XStack } from 'tamagui';
import { AppText, AppCard, Container } from '@next-web/ui';
import { useAccounts } from '../../../hooks/useAccounts';
import { formatCurrency } from '@next-web/shared/formatters';
import { ACCOUNT_TYPE_LABELS } from '@next-web/shared/constants';
import type { AccountData } from '@next-web/shared/types';

/** Accounts list screen. */
export default function AccountsScreen() {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading) {
    return (
      <Container paddingTop="$8">
        <AppText>Loading accounts...</AppText>
      </Container>
    );
  }

  return (
    <Container paddingTop="$8">
      <YStack gap="$4">
        <AppText variant="heading">Accounts</AppText>
        {accounts?.map((account: AccountData) => (
          <AppCard key={account.id} pressable>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <AppText variant="subheading">{account.name}</AppText>
                <AppText variant="caption">{ACCOUNT_TYPE_LABELS[account.type]}</AppText>
              </YStack>
              <AppText variant="body">{formatCurrency(account.balance)}</AppText>
            </XStack>
          </AppCard>
        ))}
      </YStack>
    </Container>
  );
}
