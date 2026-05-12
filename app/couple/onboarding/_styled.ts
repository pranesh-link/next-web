import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** Full-page centring wrapper. */
export const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
`;

/** Floating card that contains the wizard steps. */
export const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 36px;
  animation: ${fadeSlideIn} 0.35s ${EASING} both;

  @media (max-width: 480px) {
    padding: 28px 20px;
  }
`;

/** Row of step-progress dots at the top of the card. */
export const StepBar = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 32px;
`;

/** A single segment in the step bar. */
export const StepDot = styled.div<{ $active: boolean; $done: boolean }>`
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: ${(p) =>
    p.$done || p.$active ? "var(--accent)" : "var(--border)"};
  opacity: ${(p) => (p.$active && !p.$done ? 0.5 : 1)};
  transition: all 0.3s ${EASING};
`;

/** Large centred emoji used as a step illustration. */
export const BigIcon = styled.div`
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
`;

/** Main step heading. */
export const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  margin: 0 0 10px;
  letter-spacing: -0.4px;
`;

/** Descriptive copy below the step title. */
export const Description = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
  margin: 0 0 24px;
`;

/** Vertical label + input pair. */
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

/** Form field label. */
export const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
`;

/** Text / number input. */
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

/** Dropdown select. */
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

/** Flex row for action buttons. */
export const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 28px;
`;

/** Primary CTA button. */
export const PrimaryButton = styled.button`
  flex: 1;
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px;
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

/** Ghost skip button. */
export const SkipButton = styled.button`
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 20px;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    border-color: var(--text-muted);
    color: var(--text);
  }
`;

/** Inline validation error text. */
export const ErrorText = styled.p`
  font-size: 13px;
  color: var(--danger);
  margin: 4px 0 0;
`;
