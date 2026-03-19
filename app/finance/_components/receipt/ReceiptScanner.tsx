"use client";

import { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Types ── */

export type ScannedReceipt = {
  storeName?: string;
  totalAmount?: number;
  date?: string | null;
  category?: string;
  description?: string;
  items?: { name: string; amount: number }[];
  confidence?: number;
};

interface ReceiptScannerProps {
  onScanComplete: (data: ScannedReceipt) => void;
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

const DropZone = styled.label<{ $dragging?: boolean; $hasImage?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: ${(p) => (p.$hasImage ? "auto" : "200px")};
  border: 2px dashed
    ${(p) =>
      p.$dragging
        ? "var(--accent)"
        : p.$hasImage
          ? "rgba(34, 197, 94, 0.4)"
          : "var(--border)"};
  border-radius: 12px;
  background: ${(p) =>
    p.$dragging
      ? "rgba(59, 130, 246, 0.08)"
      : p.$hasImage
        ? "rgba(34, 197, 94, 0.04)"
        : "var(--surface)"};
  cursor: pointer;
  transition: all 0.2s ${EASING};
  overflow: hidden;
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

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
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

/* ── Component ── */

export default function ReceiptScanner({
  onScanComplete,
  onClose,
}: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
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
      formData.append("receipt", file);

      const res = await fetch("/api/finance/scan-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to scan receipt");
        setScanning(false);
        return;
      }

      setResult(data.data);
    } catch {
      setError("Failed to scan receipt. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  function handleUseResult() {
    if (result) {
      onScanComplete(result);
    }
  }

  function getConfidenceLevel(
    c: number
  ): "high" | "medium" | "low" {
    if (c >= 75) return "high";
    if (c >= 50) return "medium";
    return "low";
  }

  return (
    <Wrapper>
      {!scanning && !result && (
        <DropZone
          $dragging={dragging}
          $hasImage={!!preview}
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
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {preview ? (
            <PreviewImage src={preview} alt="Receipt preview" />
          ) : (
            <>
              <UploadIcon>📸</UploadIcon>
              <UploadText>
                Tap to take a photo or upload a receipt
              </UploadText>
              <UploadHint>Supports JPG, PNG, HEIC/HEIF up to 10MB</UploadHint>
            </>
          )}
        </DropZone>
      )}

      {scanning && (
        <ScanningOverlay>
          <Spinner />
          <ScanningText>Analyzing receipt…</ScanningText>
        </ScanningOverlay>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {result && (
        <ResultCard>
          <ResultTitle>
            Scanned Result
            {result.confidence != null && (
              <>
                {" "}
                <ConfidenceBadge
                  $level={getConfidenceLevel(result.confidence)}
                >
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
              <ResultValue>
                ₹{result.totalAmount.toLocaleString("en-IN")}
              </ResultValue>
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
                "Scan Receipt"
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
                setPreview(null);
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
