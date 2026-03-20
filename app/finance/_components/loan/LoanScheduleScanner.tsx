"use client";

import { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Types ── */

export type ScannedLoanData = {
  loanName?: string;
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
  confidence?: number;
  error?: string;
};

interface LoanScheduleScannerProps {
  onScanComplete: (data: ScannedLoanData) => void;
  onClose: () => void;
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

  &:hover {
    background: var(--surface-hover);
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
  gap: 12px;
  padding: 32px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const ScanningText = styled.p`
  font-size: 14px;
  color: var(--accent-light);
  font-weight: 500;
  margin: 0;
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
}: LoanScheduleScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedLoanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleScan() {
    if (!file) return;
    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("schedule", file);

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
          <Spinner />
          <ScanningText>Analyzing repayment schedule…</ScanningText>
        </ScanningOverlay>
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
        </ResultCard>
      )}

      <ButtonRow>
        {!result ? (
          <>
            <CancelButton type="button" onClick={onClose}>
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
