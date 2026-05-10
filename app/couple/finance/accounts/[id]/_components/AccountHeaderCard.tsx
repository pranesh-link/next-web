"use client";

import {
  AccountHeader,
  AccountTop,
  IconCircle,
  AccountMeta,
  AccountName,
  AccountType,
  HeaderBadges,
  NicknameBadge,
  EmergencyBadge,
  SourceBadge,
  BalanceDisplay,
  BalanceSub,
  HeaderActions,
  SmallButton,
  PinToggle,
} from "../_styled";
import { Account, formatCurrency, formatDate, typeIcon, typeLabel } from "../_utils";

type Props = {
  account: Account;
  onEdit: () => void;
  onUpdateBalance: () => void;
  onTogglePin: () => void;
  onToggleEmergency: () => void;
};

export default function AccountHeaderCard({
  account,
  onEdit,
  onUpdateBalance,
  onTogglePin,
  onToggleEmergency,
}: Props) {
  return (
    <AccountHeader>
      <AccountTop>
        <IconCircle>{typeIcon(account.type)}</IconCircle>
        <AccountMeta>
          <AccountName>{account.name}</AccountName>
          <AccountType>
            {typeLabel(account.type)} · {account.user?.name ?? "You"}
          </AccountType>
          <HeaderBadges>
            {account.nickname && (
              <NicknameBadge>{account.nickname}</NicknameBadge>
            )}
            {account.isEmergencyFund && (
              <EmergencyBadge>🛡️ Emergency Fund</EmergencyBadge>
            )}
            {account.isPinned && (
              <SourceBadge $source="balance">📌 Pinned</SourceBadge>
            )}
          </HeaderBadges>
        </AccountMeta>
      </AccountTop>
      <BalanceDisplay>{formatCurrency(account.balance)}</BalanceDisplay>
      <BalanceSub>Updated {formatDate(account.updatedAt)}</BalanceSub>
      <HeaderActions>
        <SmallButton onClick={onEdit}>Edit</SmallButton>
        <SmallButton $variant="primary" onClick={onUpdateBalance}>Update Balance</SmallButton>
        <PinToggle onClick={onTogglePin}>
          {account.isPinned ? "📌 Unpin" : "📌 Pin"}
        </PinToggle>
        <SmallButton onClick={onToggleEmergency}>
          {account.isEmergencyFund ? "🛡️ Remove Emergency" : "🛡️ Emergency Fund"}
        </SmallButton>
      </HeaderActions>
    </AccountHeader>
  );
}
