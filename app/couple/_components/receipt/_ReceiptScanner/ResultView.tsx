"use client";

import {
  ConfidenceBadge,
  ResultCard,
  ResultLabel,
  ResultRow,
  ResultTitle,
  ResultValue,
} from "./styled";
import { type ScannedReceipt, getConfidenceLevel } from "./utils";

/** Props for {@link ReceiptResultView}. */
interface ReceiptResultViewProps {
  /** Parsed receipt result. */
  result: ScannedReceipt;
}

/**
 * Render the parsed receipt fields after a successful scan.
 *
 * @param props - See {@link ReceiptResultViewProps}.
 */
export function ReceiptResultView({ result }: ReceiptResultViewProps) {
  return (
    <ResultCard>
      <ResultTitle>
        Scanned Result
        {result.confidence != null && (
          <>
            {" "}
            <ConfidenceBadge $level={getConfidenceLevel(result.confidence)}>
              {result.confidence}% confidence
            </ConfidenceBadge>
          </>
        )}
      </ResultTitle>
      {result.storeName && (
        <ResultRow>
          <ResultLabel>Store</ResultLabel>
          <ResultValue>{result.storeName}</ResultValue>
        </ResultRow>
      )}
      {result.totalAmount != null && (
        <ResultRow>
          <ResultLabel>Amount</ResultLabel>
          <ResultValue>₹{result.totalAmount.toLocaleString("en-IN")}</ResultValue>
        </ResultRow>
      )}
      {result.date && (
        <ResultRow>
          <ResultLabel>Date</ResultLabel>
          <ResultValue>{result.date}</ResultValue>
        </ResultRow>
      )}
      {result.category && (
        <ResultRow>
          <ResultLabel>Category</ResultLabel>
          <ResultValue>{result.category}</ResultValue>
        </ResultRow>
      )}
      {result.description && (
        <ResultRow>
          <ResultLabel>Description</ResultLabel>
          <ResultValue>{result.description}</ResultValue>
        </ResultRow>
      )}
    </ResultCard>
  );
}
