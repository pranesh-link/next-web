import styled, { keyframes } from "styled-components";

/** Top-level form grid; mobile-first single column with reduced gap on small screens. */
export const FormWrapper = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media screen and (max-width: 480px) {
    gap: 16px;
  }
`;

/** Wrapper around a label + input + error trio. */
export const FieldGroup = styled.div``;

/** Card container for the live progress preview. */
export const ProgressBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
`;

/** Header row inside {@link ProgressBox} (label + percentage). */
export const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

/** Muted "Progress" label inside {@link ProgressHeader}. */
export const ProgressLabel = styled.span`
  font-size: 12px;
  color: #64748b;
`;

/** Accent-coloured percentage value inside {@link ProgressHeader}. */
export const ProgressPct = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
`;

/** Background track for the progress bar. */
export const ProgressTrack = styled.div`
  height: 4px;
  width: 100%;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
`;

const fillAnim = keyframes`
  from { width: 0%; }
`;

/** Animated foreground fill of the progress bar; width driven by `$pct` (0–100). */
export const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  animation: ${fillAnim} 0.6s ease-out;
`;

/** "X remaining" subtext below the progress bar. */
export const RemainingText = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 8px 0 0;
`;

/** Inline muted "(optional)" hint shown next to optional field labels. */
export const OptionalHint = styled.span`
  color: #94a3b8;
`;

/** Action row containing the submit and cancel buttons. */
export const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 4px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/** Inline rotating spinner shown next to the submit label while loading. */
export const Spinner = styled.svg`
  width: 16px;
  height: 16px;
  margin-right: 8px;
  animation: ${spin} 0.7s linear infinite;
`;
