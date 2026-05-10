"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Card, SectionTitle, Subtle, Button, GhostButton } from "@/couple/lifestyle/wellness/_styled";
import Modal from "@/couple/_components/shared/Modal";
import { formatDate } from "@/_lib/formatters";
import { getBMI, categoryFromBmi } from "@/_services/lifestyle/bmi";
import { BMI_BANDS } from "@/couple/lifestyle/wellness/_constants";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";

/** Props for {@link MetricsTable}. */
export interface Props {
  /** Body-metric rows to render. Latest first is recommended. */
  metrics: BodyMetricRow[];
  /** Called when the user confirms deletion of a row. */
  onDelete: (id: string) => void;
  /** When true, disables interactive controls. */
  loading?: boolean;
}

const DesktopWrap = styled.div`
  display: block;
  overflow-x: auto;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileWrap = styled.div`
  display: none;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Table = styled.table`
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

const RowCard = styled.div`
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

const Cell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const FullCell = styled.span`
  grid-column: 1 / -1;
  color: var(--text-muted);
  font-size: 12px;
`;

const Pill = styled.span<{ $bg: string }>`
  background: ${(p) => p.$bg};
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
`;

const IconButton = styled.button`
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

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const DangerButton = styled(Button)`
  background: var(--danger);
`;

interface RowVm {
  id: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  category: { label: string; color: string };
  note: string;
}

function bandFor(key: string) {
  const band = BMI_BANDS.find((b) => b.key === key || b.key === (key === "healthy" ? "normal" : key));
  return band ?? BMI_BANDS[1];
}

function toVm(m: BodyMetricRow): RowVm {
  const weight = Number(m.weightInKg);
  const height = Number(m.heightInCm);
  const bmi = getBMI({ heightInCm: height, weightInKg: weight });
  const cat = categoryFromBmi(bmi);
  const band = bandFor(cat);
  return {
    id: m.id,
    date: formatDate(m.measuredOn),
    weight,
    height,
    bmi: Number(bmi.toFixed(1)),
    category: { label: band.label, color: band.color },
    note: m.note ?? "",
  };
}

/**
 * Tabular history of body-metric entries with a confirm-delete modal.
 * Renders a desktop `<table>` and a mobile card list, swapping via CSS.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the entry history.
 */
export default function MetricsTable({ metrics, onDelete, loading }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (metrics.length === 0) {
    return (
      <Card>
        <SectionTitle>History</SectionTitle>
        <Subtle>No entries yet.</Subtle>
      </Card>
    );
  }

  const rows = metrics.map(toVm);
  const pendingRow = rows.find((r) => r.id === pendingDeleteId) ?? null;

  function confirmDelete() {
    if (!pendingDeleteId) return;
    onDelete(pendingDeleteId);
    setPendingDeleteId(null);
  }

  return (
    <Card>
      <SectionTitle>History</SectionTitle>

      <DesktopWrap>
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight (kg)</th>
              <th>Height (cm)</th>
              <th>BMI</th>
              <th>Category</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-testid="metrics-row">
                <td>{r.date}</td>
                <td>{r.weight.toFixed(1)}</td>
                <td>{r.height.toFixed(1)}</td>
                <td>{r.bmi.toFixed(1)}</td>
                <td>
                  <Pill $bg={r.category.color}>{r.category.label}</Pill>
                </td>
                <td>{r.note}</td>
                <td>
                  <IconButton
                    type="button"
                    aria-label={`Delete entry from ${r.date}`}
                    disabled={loading}
                    onClick={() => setPendingDeleteId(r.id)}
                  >
                    Delete
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DesktopWrap>

      <MobileWrap>
        {rows.map((r) => (
          <RowCard key={r.id} data-testid="metrics-mobile-row">
            <Cell>
              <strong>{r.date}</strong>
            </Cell>
            <Cell>
              <Pill $bg={r.category.color}>{r.category.label}</Pill>
            </Cell>
            <Cell>Weight: {r.weight.toFixed(1)} kg</Cell>
            <Cell>BMI: {r.bmi.toFixed(1)}</Cell>
            <Cell>Height: {r.height.toFixed(1)} cm</Cell>
            <Cell>
              <IconButton
                type="button"
                aria-label={`Delete entry from ${r.date}`}
                disabled={loading}
                onClick={() => setPendingDeleteId(r.id)}
              >
                Delete
              </IconButton>
            </Cell>
            {r.note ? <FullCell>{r.note}</FullCell> : null}
          </RowCard>
        ))}
      </MobileWrap>

      <Modal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title="Delete entry"
        size="sm"
      >
        <Subtle>Delete the entry from {pendingRow?.date ?? "this date"}?</Subtle>
        <ModalActions>
          <GhostButton type="button" onClick={() => setPendingDeleteId(null)}>
            Cancel
          </GhostButton>
          <DangerButton type="button" onClick={confirmDelete}>
            Delete
          </DangerButton>
        </ModalActions>
      </Modal>
    </Card>
  );
}
