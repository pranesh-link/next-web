"use client";

import {
  Actions,
  Badge,
  BadgeRow,
  Button,
  Card,
  CardTitle,
  CardTop,
  Row,
  Value,
} from "../_styled";
import type { Investment } from "../_types";
import { formatCurrency } from "../_utils";

type Props = {
  item: Investment;
  onEdit: (item: Investment) => void;
  onDelete: (id: string) => void;
};

export default function InvestmentCard({ item, onEdit, onDelete }: Props) {
  const current = item.currentValue ?? item.investedAmount;
  const pnl = current - item.investedAmount;

  return (
    <Card>
      <CardTop>
        <div>
          <CardTitle>{item.name}</CardTitle>
          <BadgeRow>
            <Badge>{item.assetType.replace("_", " ")}</Badge>
            <Badge>{item.mode}</Badge>
            {item.exchange && <Badge>{item.exchange}</Badge>}
          </BadgeRow>
        </div>
        <Actions>
          <Button onClick={() => onEdit(item)}>Edit</Button>
          <Button $variant="danger" onClick={() => onDelete(item.id)}>
            Delete
          </Button>
        </Actions>
      </CardTop>

      <Row>
        <span>Invested</span>
        <Value>{formatCurrency(item.investedAmount)}</Value>
      </Row>
      <Row>
        <span>Current</span>
        <Value>{formatCurrency(current)}</Value>
      </Row>
      <Row>
        <span>P/L</span>
        <Value $good={pnl >= 0} $bad={pnl < 0}>
          {formatCurrency(pnl)}
        </Value>
      </Row>
      {item.assetType === "STOCK" && item.quantity ? (
        <Row>
          <span>Qty</span>
          <Value>{item.quantity}</Value>
        </Row>
      ) : null}
      {(item.assetType === "GOLD" || item.assetType === "SILVER") && item.quantityGrams ? (
        <Row>
          <span>Weight</span>
          <Value>{item.quantityGrams} g</Value>
        </Row>
      ) : null}
      {item.mode === "SIP" && item.sipAmount ? (
        <Row>
          <span>SIP</span>
          <Value>{formatCurrency(item.sipAmount)}</Value>
        </Row>
      ) : null}
    </Card>
  );
}
