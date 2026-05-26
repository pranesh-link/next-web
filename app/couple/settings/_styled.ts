import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Page wrapper constraining max-width for settings. */
export const PageWrapper = styled.main`
  padding: 32px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

/** Card-like section grouping related settings fields. */
export const Section = styled.section`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/** Section heading. */
export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.3px;
`;

/** Wraps a label + input pair vertically. */
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/** Form field label. */
export const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
`;

/** Text / number input field. */
export const Input = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ${EASING};

  &:focus {
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
`;

/** Dropdown select field. */
export const Select = styled.select`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ${EASING};

  &:focus {
    border-color: var(--accent);
  }
`;

/** Primary save / submit button. */
export const SaveButton = styled.button`
  align-self: flex-start;
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Row holding a toggle label and its switch. */
export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

/** Label displayed next to a toggle switch. */
export const ToggleLabel = styled.span`
  font-size: 14px;
  color: var(--text);
`;

/** Toggle track (pill background). */
export const Toggle = styled.div<{ $active: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: ${(p) => (p.$active ? "var(--accent)" : "var(--border)")};
  cursor: pointer;
  position: relative;
  transition: background 0.25s ${EASING};
  flex-shrink: 0;
`;

/** Sliding knob inside a toggle track. */
export const ToggleKnob = styled.div<{ $active: boolean }>`
  position: absolute;
  top: 3px;
  left: ${(p) => (p.$active ? "23px" : "3px")};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: left 0.25s ${EASING};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
`;

/** Inline error banner. */
export const ErrorBanner = styled.div`
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--danger);
`;

/** Inline success banner. */
export const SuccessBanner = styled.div`
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--accent);
`;

/** Segmented control container for theme preference toggle. */
export const SegmentedControl = styled.div`
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
`;

/** Individual segment option in the theme toggle. */
export const SegmentOption = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#ffffff" : "var(--text-dim)")};

  &:hover:not([disabled]) {
    background: ${(p) => (p.$active ? "var(--accent)" : "var(--surface-hover)")};
  }
`;
