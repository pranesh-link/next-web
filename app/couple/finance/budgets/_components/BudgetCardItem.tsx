"use client";

import {
  BudgetCard,
  CardHeader,
  CategoryName,
  ExceededBadge,
  CardActions,
  IconButton,
  ProgressTrack,
  ProgressFill,
  AmountRow,
  SpentAmount,
  LimitAmount,
  RemainingText,
} from "../_styled";
import { type BudgetItem, formatCurrency } from "../_utils";

type Props = {
  item: BudgetItem;
  onEdit: (item: BudgetItem) => void;
  onDeletePrompt: (id: string) => void;
};

export default function BudgetCardItem({
  item,
  onEdit,
  onDeletePrompt,
}: Props) {
  const pct =
    item.budget.limit > 0 ? (item.spent / item.budget.limit) * 100 : 0;

  return (
    <BudgetCard $exceeded={item.exceeded}>
      <CardHeader>
        <div>
          <CategoryName>{item.budget.category}</CategoryName>
          {item.exceeded && <ExceededBadge>Exceeded!</ExceededBadge>}
        </div>
        <CardActions>
          <IconButton
            $variant="edit"
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.budget.category} budget`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </IconButton>
          <IconButton
            $variant="delete"
            type="button"
            onClick={() => onDeletePrompt(item.budget.id)}
            aria-label={`Delete ${item.budget.category} budget`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </IconButton>
        </CardActions>
      </CardHeader>

      <ProgressTrack>
        <ProgressFill $width={pct} $exceeded={item.exceeded} />
      </ProgressTrack>

      <AmountRow>
        <SpentAmount $exceeded={item.exceeded}>
          {formatCurrency(item.spent)}
        </SpentAmount>
        <LimitAmount>/ {formatCurrency(item.budget.limit)}</LimitAmount>
      </AmountRow>
      <RemainingText $exceeded={item.exceeded}>
        {item.exceeded
          ? `Over by ${formatCurrency(Math.abs(item.remaining))}`
          : `${formatCurrency(item.remaining)} remaining`}
      </RemainingText>
    </BudgetCard>
  );
}
