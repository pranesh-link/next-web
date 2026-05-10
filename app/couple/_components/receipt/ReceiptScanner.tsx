"use client";

import { useRef, useState } from "react";
import { scanReceiptAction } from "@/couple/finance/_actions/receipt-scan";
import { ReceiptResultView } from "./_ReceiptScanner/ResultView";
import {
  ButtonRow,
  CancelButton,
  DropZone,
  ErrorText,
  HiddenInput,
  OptionButton,
  OptionHint,
  OptionIcon,
  OptionLabel,
  PreviewImage,
  ScanButton,
  ScanningOverlay,
  ScanningText,
  Spinner,
  UploadHint,
  UploadOptions,
  Wrapper,
} from "./_ReceiptScanner/styled";
import { type ScannedReceipt, compressImage } from "./_ReceiptScanner/utils";

export type { ScannedReceipt } from "./_ReceiptScanner/utils";

/** Props for {@link ReceiptScanner}. */
interface ReceiptScannerProps {
  /** Called with the parsed result when the user clicks "Use This Data". */
  onScanComplete: (data: ScannedReceipt) => void;
  /** Called when the user cancels the scan flow. */
  onClose: () => void;
  /** Optional callback notified whenever a scan starts or finishes. */
  onScanningChange?: (scanning: boolean) => void;
}

/**
 * Modal-friendly receipt scanner: take photo or upload, then OCR via server action.
 *
 * @param props - See {@link ReceiptScannerProps}.
 */
export default function ReceiptScanner({
  onScanComplete,
  onClose,
  onScanningChange,
}: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning_] = useState(false);
  const setScanning = (v: boolean) => {
    setScanning_(v);
    onScanningChange?.(v);
  };
  const [result, setResult] = useState<ScannedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

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
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("receipt", compressed);

      const data = await scanReceiptAction(formData);

      if (!data.success) {
        setError(data.error || "Failed to scan receipt");
        setScanning(false);
        return;
      }

      setResult({
        ...data.data,
        storeName: data.data.storeName ?? undefined,
        totalAmount: data.data.totalAmount ?? undefined,
      });
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

  return (
    <Wrapper>
      {!scanning && !result && (
        <>
          {/* Hidden file inputs */}
          <HiddenInput
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <HiddenInput
            ref={uploadRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {preview ? (
            <DropZone
              $dragging={dragging}
              $hasImage
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => uploadRef.current?.click()}
            >
              <PreviewImage src={preview} alt="Receipt preview" />
            </DropZone>
          ) : (
            <>
              <UploadOptions>
                <OptionButton
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                >
                  <OptionIcon>📸</OptionIcon>
                  <OptionLabel>Take Photo</OptionLabel>
                  <OptionHint>Use your camera</OptionHint>
                </OptionButton>
                <OptionButton
                  type="button"
                  onClick={() => uploadRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  style={
                    dragging
                      ? {
                          borderColor: "var(--accent)",
                          background: "rgba(59, 130, 246, 0.08)",
                        }
                      : undefined
                  }
                >
                  <OptionIcon>📁</OptionIcon>
                  <OptionLabel>Upload Image</OptionLabel>
                  <OptionHint>From gallery or files</OptionHint>
                </OptionButton>
              </UploadOptions>
              <UploadHint>
                Supports JPG, PNG, WebP, HEIC/HEIF up to 10MB
              </UploadHint>
            </>
          )}
        </>
      )}

      {scanning && (
        <ScanningOverlay>
          <Spinner />
          <ScanningText>Analyzing receipt…</ScanningText>
        </ScanningOverlay>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {result && <ReceiptResultView result={result} />}

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
