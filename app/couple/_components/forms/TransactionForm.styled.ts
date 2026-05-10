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

/** Horizontal layout for the income/expense radio options. */
export const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 4px;
`;

/** Clickable radio label tinted by transaction variant (income/expense). */
export const RadioLabel = styled.label<{ $variant?: "income" | "expense" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) =>
    p.$variant === "income"
      ? "#16a34a"
      : p.$variant === "expense"
        ? "#dc2626"
        : "#64748b"};
`;

/** Decorative radio bullet whose colour follows the selected variant. */
export const RadioCircle = styled.span<{ $checked?: boolean; $color?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid
    ${(p) => (p.$checked ? p.$color || "#3b82f6" : "#d1d5db")};
  transition: border-color 0.2s ease, background 0.2s ease;

  &::after {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${(p) =>
      p.$checked ? p.$color || "#3b82f6" : "transparent"};
    transition: background 0.2s ease;
  }
`;

/** Visually hidden native radio input that drives {@link RadioCircle}. */
export const HiddenRadio = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

/** Themed multi-line description textarea. */
export const StyledTextarea = styled.textarea`
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  &::placeholder {
    color: #9ca3af;
  }
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
