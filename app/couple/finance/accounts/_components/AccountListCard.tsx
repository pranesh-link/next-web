"use client";

import LastUpdatedBadge from "@/couple/_components/shared/LastUpdatedBadge";
import {
  AccountCard,
  PinnedCard,
  PinButton,
  CardHeader,
  CardIcon,
  CardInfo,
  CardNameRow,
  CardName,
  NicknameBadge,
  SalaryBadge,
  EmergencyBadge,
  CardType,
  CardBalance,
  CardMetaRow,
  CardMetaLeft,
  CardChevron,
  CardActions,
  AddIncomeBtn,
  CardActionBtn,
} from "../_styled";
import { Account, formatCurrency, typeIcon, typeLabel } from "../_utils";

type Props = {
  account: Account;
  currentUserId: string;
  onCardClick: (id: string) => void;
  onPrefetch: (id: string) => void;
  onPinClick: (e: React.MouseEvent, id: string) => void;
  onAddIncomeClick: () => void;
  onEditNicknameClick: (account: Account) => void;
  onUpdateBalanceClick: (account: Account) => void;
};

export default function AccountListCard({
  account: acc,
  currentUserId,
  onCardClick,
  onPrefetch,
  onPinClick,
  onAddIncomeClick,
  onEditNicknameClick,
  onUpdateBalanceClick,
}: Props) {
  const CardComponent = acc.isPinned ? PinnedCard : AccountCard;
  return (
    <CardComponent
      onMouseEnter={() => onPrefetch(acc.id)}
      onFocus={() => onPrefetch(acc.id)}
      onClick={() => onCardClick(acc.id)}
    >
      <PinButton
        $pinned={acc.isPinned}
        onClick={(e) => onPinClick(e, acc.id)}
        title={acc.isPinned ? "Unpin" : "Pin to top"}
      >
        📌
      </PinButton>
      <CardHeader>
        <CardIcon>{typeIcon(acc.type)}</CardIcon>
        <CardInfo>
          <CardNameRow>
            <CardName>{acc.name}</CardName>
            {acc.nickname && <NicknameBadge>{acc.nickname}</NicknameBadge>}
            {acc.isSalaryAccount && <SalaryBadge>Salary</SalaryBadge>}
            {acc.isEmergencyFund && <EmergencyBadge>🛡️ Emergency</EmergencyBadge>}
          </CardNameRow>
          <CardType>{typeLabel(acc.type)}</CardType>
          <CardBalance>{formatCurrency(acc.balance)}</CardBalance>
          <CardMetaRow>
            <CardMetaLeft>
              <LastUpdatedBadge
                name={acc.user?.name}
                userId={acc.userId}
                currentUserId={currentUserId}
                updatedAt={acc.updatedAt}
              />
            </CardMetaLeft>
            <CardChevron>›</CardChevron>
          </CardMetaRow>
        </CardInfo>
      </CardHeader>
      <CardActions>
        {acc.isSalaryAccount && (
          <AddIncomeBtn
            onClick={(e) => {
              e.stopPropagation();
              onAddIncomeClick();
            }}
          >
            💰 Add Income
          </AddIncomeBtn>
        )}
        <CardActionBtn onClick={(e) => {
          e.stopPropagation();
          onEditNicknameClick(acc);
        }}>
          ✏️ Nickname
        </CardActionBtn>
        <CardActionBtn onClick={(e) => {
          e.stopPropagation();
          onUpdateBalanceClick(acc);
        }}>
          💰 Balance
        </CardActionBtn>
      </CardActions>
    </CardComponent>
  );
}
