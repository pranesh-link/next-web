"use client";

import {
  Actions,
  Badge,
  Button,
  Card,
  CardTitle,
  CardTop,
  Row,
  Value,
} from "../_styled";
import { formatCurrency, type Deposit } from "../_utils";

type Props = {
  /** Deposit row to render. */
  item: Deposit;
  /** Open the edit modal for this deposit. */
  onEdit: (item: Deposit) => void;
  /** Delete this deposit by id. */
  onDelete: (id: string) => void;
  /** Mark the next RD installment as paid (RD-only). */
  onMarkInstallmentPaid: (item: Deposit) => void;
};

/**
 * Render a single deposit card with principal, maturity, installment progress,
 * and edit/delete/mark-paid actions.
 *
 * @param props - {@link Props} carrying the deposit and parent callbacks.
 * @returns The deposit card element.
 */
export default function DepositCard({
  item,
  onEdit,
  onDelete,
  onMarkInstallmentPaid,
}: Props) {
  return (
    <Card>
      <CardTop>
        <div>
          <CardTitle>{item.name}</CardTitle>
          <Badge $active={item.status === "ACTIVE"}>
            {item.type === "FIXED_DEPOSIT" ? "FD" : "RD"} • {item.status}
          </Badge>
        </div>
      </CardTop>

      <Row>
        <span>Principal</span>
        <Value>{formatCurrency(item.principalAmount)}</Value>
      </Row>
      <Row>
        <span>Maturity</span>
        <Value>{formatCurrency(item.maturityAmount)}</Value>
      </Row>
      <Row>
        <span>Maturity Date</span>
        <Value>{new Date(item.maturityDate).toLocaleDateString("en-IN")}</Value>
      </Row>
      {item.type === "RECURRING_DEPOSIT" && (
        <>
          <Row>
            <span>Installment</span>
            <Value>{formatCurrency(item.installmentAmount ?? 0)}</Value>
          </Row>
          <Row>
            <span>Paid Progress</span>
            <Value>
              {item.paidInstallments}/{item.totalInstallments ?? "-"}
            </Value>
          </Row>
          <Row>
            <span>Expected by Date</span>
            <Value>{item.expectedInstallmentsTillDate ?? "-"}</Value>
          </Row>
          <Row>
            <span>Time Progress</span>
            <Value>
              {typeof item.timeProgressPercentage === "number"
                ? `${item.timeProgressPercentage.toFixed(1)}%`
                : "-"}
            </Value>
          </Row>
          <Row>
            <span>Next Installment</span>
            <Value>
              {item.nextInstallmentDate
                ? new Date(item.nextInstallmentDate).toLocaleDateString("en-IN")
                : "-"}
            </Value>
          </Row>
        </>
      )}

      <Actions>
        <Button onClick={() => onEdit(item)}>Edit</Button>
        <Button $variant="danger" onClick={() => onDelete(item.id)}>
          Delete
        </Button>
        {item.type === "RECURRING_DEPOSIT" && item.status === "ACTIVE" ? (
          <Button $variant="accent" onClick={() => onMarkInstallmentPaid(item)}>
            Mark Installment Paid
          </Button>
        ) : null}
      </Actions>
    </Card>
  );
}
