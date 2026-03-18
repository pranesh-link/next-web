import styled from "styled-components";

export const FinanceCard = styled.div<{ $hoverable?: boolean }>`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  ${(props) =>
    props.$hoverable &&
    `
    &:hover {
      border-color: #93c5fd;
      background: #fafbff;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.08);
    }
  `}

  @media screen and (max-width: 768px) {
    padding: 24px;
    border-radius: 12px;
  }

  @media screen and (max-width: 480px) {
    padding: 20px;
  }
`;

export const FinanceCardHeader = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;

  &::before {
    content: "";
    width: 3px;
    height: 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
    border-radius: 2px;
  }

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`;

export const FinanceCardContent = styled.div`
  color: #64748b;
`;

export const FinanceButton = styled.button`
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FinanceButtonOutline = styled.button`
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FinanceInput = styled.input`
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
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

export const FinanceSelect = styled.select`
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8.825a.5.5 0 0 1-.354-.146l-4-4a.5.5 0 1 1 .708-.708L6 7.617l3.646-3.646a.5.5 0 1 1 .708.708l-4 4A.5.5 0 0 1 6 8.825z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  option {
    background: #ffffff;
    color: #1e293b;
  }
`;

export const FinanceLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
`;

export const FinanceErrorText = styled.span`
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
`;

export const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #94a3b8;
  margin: 0 0 24px 0;
`;

export const FinanceDivider = styled.div`
  height: 1px;
  max-width: 600px;
  margin: 0 auto;
  background: #e5e7eb;
`;
