"use client";

import { useEffect, useRef, useState } from "react";
import { scanScheduleAction } from "@/couple/finance/_actions/schedule-scan";
import { LoanResultView } from "./_LoanScheduleScanner/ResultView";
import { LOAN_TIPS_GLOBAL, LOAN_TIPS_IN } from "./_LoanScheduleScanner/tips";
import {
  ButtonRow,
  CancelButton,
  DropZone,
  ErrorText,
  FileDetails,
  FileIcon,
  FileInfo,
  FileName,
  FileSize,
  HiddenInput,
  ScanButton,
  ScanningLoader,
  ScanningOverlay,
  ScanningText,
  Spinner,
  TipBulb,
  TipCard,
  UploadHint,
  UploadIcon,
  UploadText,
  Wrapper,
} from "./_LoanScheduleScanner/styled";
import { type ScannedLoanData, type TipRegion } from "./_LoanScheduleScanner/types";
import { compressImage, formatFileSize } from "./_LoanScheduleScanner/utils";

export { LOAN_TIPS_GLOBAL } from "./_LoanScheduleScanner/tips";
export type { ScannedLoanData, TipRegion } from "./_LoanScheduleScanner/types";

/** Props for {@link LoanScheduleScanner}. */
interface LoanScheduleScannerProps {
  /** Called with the parsed loan data when the user clicks "Use This Data". */
  onScanComplete: (data: ScannedLoanData) => void;
  /** Called when the user cancels the flow. */
  onClose: () => void;
  /** Optional callback notified whenever a scan starts or finishes. */
  onScanningChange?: (scanning: boolean) => void;
  /** Region used to pick the loan tips shown during scanning (default `"in"`). */
  tipRegion?: TipRegion;
}

/**
 * Modal-friendly loan-schedule scanner: upload PDF/image and OCR via server action.
 *
 * @param props - See {@link LoanScheduleScannerProps}.
 */
export default function LoanScheduleScanner({
  onScanComplete,
  onClose,
  onScanningChange,
  tipRegion = "in",
}: LoanScheduleScannerProps) {
  const activeTips = tipRegion === "global" ? LOAN_TIPS_GLOBAL : LOAN_TIPS_IN;

  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning_] = useState(false);
  const setScanning = (v: boolean) => {
    setScanning_(v);
    onScanningChange?.(v);
  };
  const [result, setResult] = useState<ScannedLoanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const shuffledTipsRef = useRef<string[]>(
    [...activeTips].sort(() => Math.random() - 0.5),
  );

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

      const data = await scanScheduleAction(formData);

      if (!data.success) {
        setError(data.error || "Failed to scan document");
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
              <FileIcon>
                {file.type === "application/pdf" ? "📄" : "🖼️"}
              </FileIcon>
              <FileDetails>
                <FileName>{file.name}</FileName>
                <FileSize>{formatFileSize(file.size)}</FileSize>
              </FileDetails>
            </FileInfo>
          ) : (
            <>
              <UploadIcon>📄</UploadIcon>
              <UploadText>Upload your repayment schedule</UploadText>
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

      {result && <LoanResultView result={result} />}

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
