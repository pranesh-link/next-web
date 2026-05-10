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

/** Outer flex column. */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/** File-upload drop zone label. */
export const DropZone = styled.label<{ $dragging?: boolean; $hasFile?: boolean }>`
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

/** Hidden file input wired to the drop zone. */
export const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

/** Large emoji upload icon. */
export const UploadIcon = styled.div`
  font-size: 40px;
`;

/** Centered upload prompt text. */
export const UploadText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  line-height: 1.5;
`;

/** Hint about supported file types. */
export const UploadHint = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

/** Selected-file info row inside the drop zone. */
export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
`;

/** Document/image emoji icon next to the file name. */
export const FileIcon = styled.div`
  font-size: 32px;
`;

/** Flexible details column for the selected file. */
export const FileDetails = styled.div`
  flex: 1;
`;

/** File name display. */
export const FileName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  word-break: break-all;
`;

/** File size caption. */
export const FileSize = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  margin: 4px 0 0;
`;

/** Sticky footer button row. */
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

/** Primary CTA button (Scan / Use). */
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

/** Secondary button. */
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

  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Spinner animation. */
export const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

/** Centered scanning overlay. */
export const ScanningOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
`;

/** Pulsing loader cluster inside the overlay. */
export const ScanningLoader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

/** Scanning caption text. */
export const ScanningText = styled.p`
  font-size: 14px;
  color: var(--accent-light);
  font-weight: 500;
  margin: 0;
`;

/** Tip card shown during scanning. */
export const TipCard = styled.div`
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

/** Lightbulb emoji inside the tip card. */
export const TipBulb = styled.span`
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
`;

/** Inline error text. */
export const ErrorText = styled.p`
  font-size: 14px;
  color: var(--danger);
  text-align: center;
  margin: 0;
`;
