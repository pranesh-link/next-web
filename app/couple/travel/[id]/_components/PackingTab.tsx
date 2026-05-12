"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/couple/travel/_actions/checklist";
import { EASING } from "@/couple/_constants/theme";
import type { ChecklistItem } from "../../_types";
import {
  EmptyHint,
  InlineForm,
  TabInput,
  SmallPrimaryBtn,
  SmallGhostBtn,
  DeleteBtn,
  AddItemBtn,
} from "../_styled";

/* ── Styled ── */

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ProgressLabel = styled.span`
  font-size: 13px;
  color: var(--text-muted);
`;

const ProgressPct = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  background: var(--surface);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ${EASING};
`;

const ChecklistRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CheckRow = styled.div<{ $packed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  opacity: ${(p) => (p.$packed ? 0.6 : 1)};
  transition: opacity 0.2s ${EASING};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--accent);
`;

const ItemLabel = styled.span<{ $packed: boolean }>`
  flex: 1;
  font-size: 14px;
  color: var(--text);
  text-decoration: ${(p) => (p.$packed ? "line-through" : "none")};
  min-width: 0;
`;

const AssignedBadge = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
`;

interface PackingTabProps {
  /** ID of the parent trip. */
  tripId: string;
  /** Current checklist items from the parent fetch. */
  items: ChecklistItem[];
  /** Callback to re-fetch parent trip data after a mutation. */
  onRefresh: () => Promise<void>;
}

/** Displays and manages the trip packing checklist. */
export default function PackingTab({
  tripId,
  items,
  onRefresh,
}: PackingTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const packed = items.filter((i) => i.packed).length;
  const pct = items.length > 0 ? Math.round((packed / items.length) * 100) : 0;

  async function handleToggle(id: string) {
    setTogglingId(id);
    await toggleChecklistItem(id);
    await onRefresh();
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    await deleteChecklistItem(id);
    await onRefresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    setSubmitting(true);
    await addChecklistItem(tripId, newItem);
    await onRefresh();
    setNewItem("");
    setShowForm(false);
    setSubmitting(false);
  }

  return (
    <div>
      {items.length > 0 && (
        <>
          <ProgressHeader>
            <ProgressLabel>
              {packed} of {items.length} packed
            </ProgressLabel>
            <ProgressPct>{pct}%</ProgressPct>
          </ProgressHeader>
          <ProgressTrack>
            <ProgressFill $pct={pct} />
          </ProgressTrack>
        </>
      )}

      {items.length === 0 ? (
        <EmptyHint>Nothing on the packing list yet. Add your first item!</EmptyHint>
      ) : (
        <ChecklistRows>
          {items.map((item) => (
            <CheckRow key={item.id} $packed={item.packed}>
              <Checkbox
                type="checkbox"
                checked={item.packed}
                disabled={togglingId === item.id}
                onChange={() => handleToggle(item.id)}
              />
              <ItemLabel $packed={item.packed}>{item.item}</ItemLabel>
              {item.assignedTo && (
                <AssignedBadge>→ {item.assignedTo}</AssignedBadge>
              )}
              <DeleteBtn
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label="Delete item"
              >
                ✕
              </DeleteBtn>
            </CheckRow>
          ))}
        </ChecklistRows>
      )}

      {showForm ? (
        <InlineForm onSubmit={handleAdd}>
          <TabInput
            placeholder="Item to pack *"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            required
          />
          <SmallPrimaryBtn type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add"}
          </SmallPrimaryBtn>
          <SmallGhostBtn
            type="button"
            onClick={() => {
              setShowForm(false);
              setNewItem("");
            }}
          >
            Cancel
          </SmallGhostBtn>
        </InlineForm>
      ) : (
        <AddItemBtn type="button" onClick={() => setShowForm(true)}>
          + Add Item
        </AddItemBtn>
      )}
    </div>
  );
}
