"use client";

import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

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

/** Outer flex column wrapping the scanner views. */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/** Drop-zone label that becomes the receipt-preview container. */
export const DropZone = styled.label<{ $dragging?: boolean; $hasImage?: boolean }>`
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

/** Visually hidden file input wired to the drop-zone label. */
export const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

/** Two-column layout for the camera/upload option buttons. */
export const UploadOptions = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  padding: 8px 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

/** Single camera/upload option card-button. */
export const OptionButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  background: var(--surface);
  border: 1.5px dashed var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  font-family: inherit;

  &:hover {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.04);
  }
`;

/** Large emoji icon for an option button. */
export const OptionIcon = styled.span`
  font-size: 32px;
`;

/** Bold label text inside an option button. */
export const OptionLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

/** Muted helper text inside an option button. */
export const OptionHint = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

/** Centered helper hint about supported file formats. */
export const UploadHint = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
`;

/** Receipt preview image. */
export const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
`;

/** Sticky bottom button row inside the modal body. */
export const ButtonRow = styled.div`
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

/** Primary "Scan / Use" CTA button. */
export const ScanButton = styled.button`
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

/** Secondary "Cancel / Scan another" button. */
export const CancelButton = styled.button`
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

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/** Spinner shown inside the scan button while uploading. */
export const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

/** Centered overlay shown while the OCR request is in flight. */
export const ScanningOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

/** Caption text for the scanning overlay. */
export const ScanningText = styled.p`
  font-size: 14px;
  color: var(--accent-light);
  font-weight: 500;
  margin: 0;
`;

/** Card displaying the parsed receipt fields. */
export const ResultCard = styled.div`
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  padding: 20px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

/** Title above the result card. */
export const ResultTitle = styled.p`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--success);
  margin: 0 0 12px 0;
`;

/** Single field row inside the result card. */
export const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  & + & {
    border-top: 1px solid rgba(34, 197, 94, 0.1);
  }
`;

/** Result row label. */
export const ResultLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

/** Result row value. */
export const ResultValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

/** Inline error text. */
export const ErrorText = styled.p`
  font-size: 14px;
  color: var(--danger);
  text-align: center;
  margin: 0;
`;

/** Pill badge for OCR confidence. */
export const ConfidenceBadge = styled.span<{ $level: "high" | "medium" | "low" }>`
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
