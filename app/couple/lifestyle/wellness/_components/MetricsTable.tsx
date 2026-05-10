"use client";

import React, { useState } from "react";
import { Card, SectionTitle, Subtle, Button, GhostButton } from "@/couple/lifestyle/wellness/_styled";
import Modal from "@/couple/_components/shared/Modal";
import { formatDate } from "@/_lib/formatters";
import { getBMI, categoryFromBmi } from "@/_services/lifestyle/bmi";
import { BMI_BANDS } from "@/couple/lifestyle/wellness/_constants";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";
import {
  DesktopWrap,
  MobileWrap,
  Table,
  RowCard,
  Cell,
  FullCell,
  Pill,
  IconButton,
  EditButton,
  ModalActions,
  DangerButton,
  ScrollContainer,
  ActionGroup,
  EditInput,
  FormRow,
  FormLabel,
} from "./_MetricsTable-styled";

/** Props for {@link MetricsTable}. */
export interface Props {
  /** Body-metric rows to render. Latest first is recommended. */
  metrics: BodyMetricRow[];
  /** Called when the user confirms deletion of a row. */
  onDelete: (id: string) => void;
  /** Called when the user saves an edited weight. Only rows from today/yesterday are editable. */
  onEdit: (id: string, newWeight: number) => Promise<void>;
  /** When true, disables interactive controls. */
  loading?: boolean;
}

interface RowVm {
  id: string;
  date: string;
  measuredOn: Date | string;
  weight: number;
  height: number;
  bmi: number;
  category: { label: string; color: string };
  note: string;
  editable: boolean;
  deletable: boolean;
}

/** Returns true if `measuredOn` is today or yesterday in local time. */
function isEditable(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const measured = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return measured >= yesterday;
}

/** Returns true if `measuredOn` is within the last 7 days (local time). */
function isDeletable(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const measured = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return measured >= sevenDaysAgo;
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
    measuredOn: m.measuredOn,
    weight,
    height,
    bmi: Number(bmi.toFixed(1)),
    category: { label: band.label, color: band.color },
    note: m.note ?? "",
    editable: isEditable(m.measuredOn),
    deletable: isDeletable(m.measuredOn),
  };
}

/**
 * Tabular history of body-metric entries with edit and delete modals.
 * Renders a desktop `<table>` and a mobile card list, swapping via CSS.
 * Edit is restricted to today/yesterday entries; delete to entries ≤ 7 days old.
 * The history section scrolls vertically with a 400 px max-height.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the entry history.
 */
export default function MetricsTable({ metrics, onDelete, onEdit, loading }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<{ id: string; weight: string; date: string } | null>(null);

  if (metrics.length === 0) {
    return (
      <Card id="wellness-history">
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

  async function handleSaveEdit() {
    if (!editingRow) return;
    const newWeight = parseFloat(editingRow.weight);
    if (isNaN(newWeight) || newWeight <= 0) return;
    await onEdit(editingRow.id, newWeight);
    setEditingRow(null);
  }

  function renderActions(r: RowVm) {
    if (!r.editable && !r.deletable) return "—";
    return (
      <ActionGroup>
        {r.editable && (
          <EditButton
            type="button"
            aria-label={`Edit entry from ${r.date}`}
            disabled={loading}
            onClick={() => setEditingRow({ id: r.id, weight: r.weight.toFixed(1), date: r.date })}
          >
            Edit
          </EditButton>
        )}
        {r.deletable && (
          <IconButton
            type="button"
            aria-label={`Delete entry from ${r.date}`}
            disabled={loading}
            onClick={() => setPendingDeleteId(r.id)}
          >
            Delete
          </IconButton>
        )}
      </ActionGroup>
    );
  }

  return (
    <Card id="wellness-history">
      <SectionTitle>History</SectionTitle>

      <ScrollContainer>
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
                  <td>{renderActions(r)}</td>
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
              <Cell>{renderActions(r)}</Cell>
              {r.note ? <FullCell>{r.note}</FullCell> : null}
            </RowCard>
          ))}
        </MobileWrap>
      </ScrollContainer>

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

      <Modal
        isOpen={editingRow !== null}
        onClose={() => setEditingRow(null)}
        title="Edit weight"
        size="sm"
      >
        <FormRow>
          <FormLabel>Date</FormLabel>
          <span>{editingRow?.date}</span>
        </FormRow>
        <FormRow>
          <FormLabel>Weight (kg)</FormLabel>
          <EditInput
            type="number"
            step="0.1"
            value={editingRow?.weight ?? ""}
            onChange={(e) =>
              setEditingRow((prev) => (prev ? { ...prev, weight: e.target.value } : null))
            }
          />
        </FormRow>
        <ModalActions>
          <GhostButton type="button" onClick={() => setEditingRow(null)}>
            Cancel
          </GhostButton>
          <Button type="button" onClick={handleSaveEdit}>
            Save
          </Button>
        </ModalActions>
      </Modal>
    </Card>
  );
}
