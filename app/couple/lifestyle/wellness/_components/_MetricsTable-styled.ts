import styled from "styled-components";
import { Button } from "@/couple/lifestyle/wellness/_styled";

export const DesktopWrap = styled.div`
  display: block;
  overflow-x: auto;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MobileWrap = styled.div`
  display: none;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 768px) {
    display: flex;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: var(--text);

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface);
  }
`;

export const RowCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 12px;
  font-size: 13px;
  color: var(--text);
`;

export const Cell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const FullCell = styled.span`
  grid-column: 1 / -1;
  color: var(--text-muted);
  font-size: 12px;
`;

export const Pill = styled.span<{ $bg: string }>`
  background: ${(p) => p.$bg};
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
`;

export const IconButton = styled.button`
  background: transparent;
  border: 1px solid var(--border);
  color: var(--danger);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: var(--surface);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const EditButton = styled(IconButton)`
  color: var(--accent);
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

export const DangerButton = styled(Button)`
  background: var(--danger);
`;

export const ScrollContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

export const ActionGroup = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const EditInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

export const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

export const FormLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
`;
