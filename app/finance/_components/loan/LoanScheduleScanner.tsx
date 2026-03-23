"use client";

import { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Types ── */

export type ScannedLoanData = {
  loanName?: string;
  loanProvider?: string | null;
  loanAccountNumber?: string | null;
  scheduleGeneratedOn?: string | null;
  principal?: number;
  interestRate?: number;
  tenureMonths?: number;
  emiAmount?: number;
  startDate?: string | null;
  remainingBalance?: number;
  schedule?: {
    month: number;
    date: string;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
  totalScheduleRows?: number;
  prepayments?: { date: string; amount: number; balanceAfter?: number }[];
  emisPaid?: number;
  confidence?: number;
  error?: string;
};

export type TipRegion = "in" | "global";

interface LoanScheduleScannerProps {
  onScanComplete: (data: ScannedLoanData) => void;
  onClose: () => void;
  onScanningChange?: (scanning: boolean) => void;
  tipRegion?: TipRegion;
}

/* ── Keyframes ── */

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Styled Components ── */

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DropZone = styled.label<{ $dragging?: boolean; $hasFile?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  border: 2px dashed
    ${(p) =>
      p.$dragging
        ? "var(--accent)"
        : p.$hasFile
          ? "rgba(34, 197, 94, 0.4)"
          : "var(--border)"};
  border-radius: 12px;
  background: ${(p) =>
    p.$dragging
      ? "rgba(59, 130, 246, 0.08)"
      : p.$hasFile
        ? "rgba(34, 197, 94, 0.04)"
        : "var(--surface)"};
  cursor: pointer;
  transition: all 0.2s ${EASING};
  position: relative;

  &:hover {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.04);
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const UploadIcon = styled.div`
  font-size: 40px;
`;

const UploadText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  line-height: 1.5;
`;

const UploadHint = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
`;

const FileIcon = styled.div`
  font-size: 32px;
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  word-break: break-all;
`;

const FileSize = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  margin: 4px 0 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  position: sticky;
  bottom: -28px;
  margin: 0 -28px -28px;
  padding: 16px 28px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  z-index: 1;
`;

const ScanButton = styled.button`
  flex: 1;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

const ScanningOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
`;

const ScanningLoader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const ScanningText = styled.p`
  font-size: 14px;
  color: var(--accent-light);
  font-weight: 500;
  margin: 0;
`;

const TipCard = styled.div`
  background: rgba(59, 130, 246, 0.22);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  font-style: italic;
  text-align: center;
  animation: ${fadeIn} 0.4s ease-out;
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TipBulb = styled.span`
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
`;

const ResultCard = styled.div`
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  padding: 20px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const ResultTitle = styled.p`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--success);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  & + & {
    border-top: 1px solid rgba(34, 197, 94, 0.1);
  }
`;

const ResultLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

const ResultValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

const ScheduleInfo = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 8px 0 0;
  font-style: italic;
`;

const PrepaymentSection = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(var(--accent-rgb, 99, 102, 241), 0.08);
  border-radius: 8px;
  border: 1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.15);
`;

const PrepaymentTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
`;

const PrepaymentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(var(--border-rgb, 255, 255, 255), 0.06);

  &:last-of-type {
    border-bottom: none;
  }
`;

const PrepaymentDate = styled.span`
  min-width: 90px;
`;

const PrepaymentAmount = styled.span`
  font-weight: 600;
  color: var(--success, #22c55e);
`;

const PrepaymentBalance = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
`;

const PrepaymentTotal = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--border-rgb, 255, 255, 255), 0.1);
  font-size: 13px;
  font-weight: 600;
  color: var(--success, #22c55e);
`;

const ErrorText = styled.p`
  font-size: 14px;
  color: var(--danger);
  text-align: center;
  margin: 0;
`;

const ConfidenceBadge = styled.span<{ $level: "high" | "medium" | "low" }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  background: ${(p) =>
    p.$level === "high"
      ? "rgba(34, 197, 94, 0.15)"
      : p.$level === "medium"
        ? "rgba(245, 158, 11, 0.15)"
        : "rgba(239, 68, 68, 0.15)"};
  color: ${(p) =>
    p.$level === "high"
      ? "var(--success)"
      : p.$level === "medium"
        ? "var(--warning)"
        : "var(--danger)"};
`;

/* ── Loan Tips ── */

const LOAN_TIPS_IN = [
  "Paying ₹500 extra per month can cut your loan tenure by months — every rupee counts",
  "Prepaying in the first half of your loan saves far more interest than in the last half",
  "Step-up EMIs — increasing your EMI by 5% each year matches salary growth and closes loans faster",
  "Keep your EMI-to-income ratio below 40% for a healthy financial balance",
  "Check your credit score before refinancing — a score above 750 gets the best rates",
  "Tax deduction under Section 24b allows up to ₹2L on home loan interest per year",
  "Section 80C lets you claim up to ₹1.5L on home loan principal repayment",
  "A home loan top-up is often cheaper than a personal loan for large expenses",
  "Balance transferring to a lower-rate lender after 2 years can save lakhs",
  "Setting up auto-debit for EMI avoids late fees and protects your credit score",
  "An emergency fund of 3–6 months expenses should come before prepayments",
  "Floating rates beat fixed rates when the RBI is in a rate-cutting cycle",
];

// Global (currency-neutral) tips — switch ACTIVE_TIPS to this for international users
export const LOAN_TIPS_GLOBAL = [
  "Paying a small extra amount each month can significantly cut your loan tenure",
  "Prepaying in the first half of your loan saves far more interest than the second half",
  "Step-up payments — increasing by ~5% yearly — matches income growth and closes loans faster",
  "Keep your total monthly loan payments below 40% of income for a healthy debt ratio",
  "Check your credit score before refinancing — a higher score unlocks the best rates",
  "Mortgage interest is often tax-deductible — check your country's tax laws for potential savings",
  "Principal repayments may qualify for tax relief in your country — consult a local advisor",
  "A home equity loan is typically cheaper than a personal loan for large one-off expenses",
  "Refinancing to a lower-rate lender after a few years of good payment history can save thousands",
  "Auto-debit for loan payments avoids late fees and protects your credit score",
  "Build a 3–6 month emergency fund before making extra loan prepayments",
  "Variable/floating rates can beat fixed rates when central banks enter a rate-cutting cycle",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Component ── */

export default function LoanScheduleScanner({
  onScanComplete,
  onClose,
  onScanningChange,
  tipRegion = "in",
}: LoanScheduleScannerProps) {
  const activeTips = tipRegion === "global" ? LOAN_TIPS_GLOBAL : LOAN_TIPS_IN;

  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning_] = useState(false);
  const setScanning = (v: boolean) => { setScanning_(v); onScanningChange?.(v); };
  const [result, setResult] = useState<ScannedLoanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const shuffledTipsRef = useRef<string[]>([...activeTips].sort(() => Math.random() - 0.5));

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % activeTips.length);
    }, 5000);
    return () => clearInterval(id);
  }, [scanning, activeTips.length]);

  function handleFile(f: File) {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(f.type)) {
      setError("Please upload a PDF or image file");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function compressImage(src: File, maxDim = 1500, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], src.name, { type: "image/jpeg" })),
          "image/jpeg",
          quality
        );
      };
      img.src = URL.createObjectURL(src);
    });
  }

  async function handleScan() {
    if (!file) return;
    shuffledTipsRef.current = [...activeTips].sort(() => Math.random() - 0.5);
    setTipIndex(0);
    setScanning(true);
    setError(null);

    try {
      const isImage = file.type.startsWith("image/");
      const toUpload = isImage ? await compressImage(file) : file;
      const formData = new FormData();
      formData.append("schedule", toUpload);

      const res = await fetch("/api/finance/scan-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to scan document");
        setScanning(false);
        return;
      }

      if (data.data?.error) {
        setError(data.data.error);
        setScanning(false);
        return;
      }

      setResult(data.data);
    } catch {
      setError("Failed to scan document. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  function handleUseResult() {
    if (result) {
      onScanComplete(result);
    }
  }

  function getConfidenceLevel(c: number): "high" | "medium" | "low" {
    if (c >= 75) return "high";
    if (c >= 50) return "medium";
    return "low";
  }

  return (
    <Wrapper>
      {!scanning && !result && (
        <DropZone
          $dragging={dragging}
          $hasFile={!!file}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <HiddenInput
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {file ? (
            <FileInfo>
              <FileIcon>{file.type === "application/pdf" ? "📄" : "🖼️"}</FileIcon>
              <FileDetails>
                <FileName>{file.name}</FileName>
                <FileSize>{formatFileSize(file.size)}</FileSize>
              </FileDetails>
            </FileInfo>
          ) : (
            <>
              <UploadIcon>📄</UploadIcon>
              <UploadText>
                Upload your repayment schedule
              </UploadText>
              <UploadHint>PDF or image (JPG, PNG) up to 20MB</UploadHint>
            </>
          )}
        </DropZone>
      )}

      {scanning && (
        <ScanningOverlay>
          <ScanningLoader>
            <Spinner />
            <ScanningText>Analyzing repayment schedule…</ScanningText>
          </ScanningLoader>
        </ScanningOverlay>
      )}

      {scanning && (
        <TipCard key={tipIndex}>
          <TipBulb>💡</TipBulb>
          {shuffledTipsRef.current[tipIndex]}
        </TipCard>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {result && (
        <ResultCard>
          <ResultTitle>
            Extracted Loan Details
            {result.confidence != null && (
              <ConfidenceBadge $level={getConfidenceLevel(result.confidence)}>
                {result.confidence}% confidence
              </ConfidenceBadge>
            )}
          </ResultTitle>
          {result.loanName && (
            <ResultRow>
              <ResultLabel>Loan Name</ResultLabel>
              <ResultValue>{result.loanName}</ResultValue>
            </ResultRow>
          )}
          {result.principal != null && (
            <ResultRow>
              <ResultLabel>Principal</ResultLabel>
              <ResultValue>{formatCurrency(result.principal)}</ResultValue>
            </ResultRow>
          )}
          {result.interestRate != null && (
            <ResultRow>
              <ResultLabel>Interest Rate</ResultLabel>
              <ResultValue>{result.interestRate}%</ResultValue>
            </ResultRow>
          )}
          {result.tenureMonths != null && (
            <ResultRow>
              <ResultLabel>Tenure</ResultLabel>
              <ResultValue>{result.tenureMonths} months</ResultValue>
            </ResultRow>
          )}
          {result.emiAmount != null && (
            <ResultRow>
              <ResultLabel>EMI Amount</ResultLabel>
              <ResultValue>{formatCurrency(result.emiAmount)}</ResultValue>
            </ResultRow>
          )}
          {result.startDate && (
            <ResultRow>
              <ResultLabel>Start Date</ResultLabel>
              <ResultValue>{result.startDate}</ResultValue>
            </ResultRow>
          )}
          {result.schedule && result.schedule.length > 0 && (
            <ScheduleInfo>
              {result.schedule.length} EMI installments extracted
            </ScheduleInfo>
          )}
          {!result.schedule && result.totalScheduleRows != null && result.totalScheduleRows > 0 && (
            <ScheduleInfo>
              {result.totalScheduleRows} EMI installments found
            </ScheduleInfo>
          )}
          {result.emisPaid != null && result.emisPaid > 0 && (
            <ResultRow>
              <ResultLabel>EMIs Paid</ResultLabel>
              <ResultValue>
                {result.emisPaid}
                {result.tenureMonths ? ` / ${result.tenureMonths}` : ""}
              </ResultValue>
            </ResultRow>
          )}
          {result.remainingBalance != null && result.remainingBalance > 0 && (
            <ResultRow>
              <ResultLabel>Outstanding Balance</ResultLabel>
              <ResultValue>{formatCurrency(result.remainingBalance)}</ResultValue>
            </ResultRow>
          )}
          {result.prepayments && result.prepayments.length > 0 && (
            <PrepaymentSection>
              <PrepaymentTitle>
                Part Prepayments ({result.prepayments.length})
              </PrepaymentTitle>
              {result.prepayments.map((pp, i) => (
                <PrepaymentRow key={i}>
                  <PrepaymentDate>{pp.date}</PrepaymentDate>
                  <PrepaymentAmount>{formatCurrency(pp.amount)}</PrepaymentAmount>
                  {pp.balanceAfter != null && (
                    <PrepaymentBalance>
                      Bal: {formatCurrency(pp.balanceAfter)}
                    </PrepaymentBalance>
                  )}
                </PrepaymentRow>
              ))}
              <PrepaymentTotal>
                Total Prepaid:{" "}
                {formatCurrency(
                  result.prepayments.reduce((s, p) => s + p.amount, 0),
                )}
              </PrepaymentTotal>
            </PrepaymentSection>
          )}
        </ResultCard>
      )}

      <ButtonRow>
        {!result ? (
          <>
            <CancelButton type="button" onClick={onClose} disabled={scanning}>
              Cancel
            </CancelButton>
            <ScanButton
              type="button"
              disabled={!file || scanning}
              onClick={handleScan}
            >
              {scanning ? (
                <>
                  <Spinner /> Scanning…
                </>
              ) : (
                "Extract Loan Details"
              )}
            </ScanButton>
          </>
        ) : (
          <>
            <CancelButton
              type="button"
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
            >
              Scan Another
            </CancelButton>
            <ScanButton type="button" onClick={handleUseResult}>
              Use This Data
            </ScanButton>
          </>
        )}
      </ButtonRow>
    </Wrapper>
  );
}
