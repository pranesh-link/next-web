"use client";

import { useState } from "react";
import styled from "styled-components";
import { addItineraryItem, deleteItineraryItem } from "@/couple/travel/_actions/itinerary";
import type { ItineraryItem } from "../../_types";
import {
  EmptyHint,
  AddItemBtn,
  InlineForm,
  TabInput,
  SmallPrimaryBtn,
  SmallGhostBtn,
  DeleteBtn,
} from "../_styled";

/* ── Styled ── */

const DaySection = styled.div`
  margin-bottom: 24px;
`;

const DayTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin: 0 0 10px;
`;

const ItemCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 8px;
`;

const ItemTime = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  white-space: nowrap;
  min-width: 40px;
  padding-top: 2px;
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
`;

const ItemMeta = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 2px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 60px 90px 1fr;
  gap: 8px;
  flex: 1;
  min-width: 0;

  @media (max-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FormRow2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const EMPTY = { day: "1", time: "", title: "", location: "", description: "" };

interface ItineraryTabProps {
  /** ID of the parent trip. */
  tripId: string;
  /** Current itinerary items from the parent fetch. */
  items: ItineraryItem[];
  /** Callback to re-fetch parent trip data after a mutation. */
  onRefresh: () => Promise<void>;
}

/** Displays and manages itinerary items grouped by day. */
export default function ItineraryTab({
  tripId,
  items,
  onRefresh,
}: ItineraryTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const days = Array.from(new Set(items.map((i) => i.day))).sort(
    (a, b) => a - b,
  );

  function setField(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    await addItineraryItem(tripId, {
      day: Number(form.day) || 1,
      time: form.time || undefined,
      title: form.title,
      description: form.description || undefined,
      location: form.location || undefined,
    });
    await onRefresh();
    setForm(EMPTY);
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await deleteItineraryItem(id);
    await onRefresh();
  }

  return (
    <div>
      {days.length === 0 && (
        <EmptyHint>No itinerary items yet. Add your first stop!</EmptyHint>
      )}

      {days.map((day) => (
        <DaySection key={day}>
          <DayTitle>Day {day}</DayTitle>
          {items
            .filter((i) => i.day === day)
            .map((item) => (
              <ItemCard key={item.id}>
                {item.time && <ItemTime>{item.time}</ItemTime>}
                <ItemContent>
                  <ItemTitle>{item.title}</ItemTitle>
                  {item.location && (
                    <ItemMeta>📍 {item.location}</ItemMeta>
                  )}
                  {item.description && (
                    <ItemMeta>{item.description}</ItemMeta>
                  )}
                </ItemContent>
                <DeleteBtn
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete item"
                >
                  ✕
                </DeleteBtn>
              </ItemCard>
            ))}
        </DaySection>
      ))}

      {showForm ? (
        <InlineForm onSubmit={handleAdd}>
          <FormGrid>
            <TabInput
              type="number"
              placeholder="Day"
              value={form.day}
              onChange={(e) => setField("day", e.target.value)}
              min={1}
              required
            />
            <TabInput
              placeholder="Time (14:00)"
              value={form.time}
              onChange={(e) => setField("time", e.target.value)}
            />
            <TabInput
              placeholder="Activity title *"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </FormGrid>
          <FormRow2>
            <TabInput
              placeholder="Location"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
            <TabInput
              placeholder="Description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </FormRow2>
          <SmallPrimaryBtn type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add"}
          </SmallPrimaryBtn>
          <SmallGhostBtn
            type="button"
            onClick={() => {
              setShowForm(false);
              setForm(EMPTY);
            }}
          >
            Cancel
          </SmallGhostBtn>
        </InlineForm>
      ) : (
        <AddItemBtn type="button" onClick={() => setShowForm(true)}>
          + Add Itinerary Item
        </AddItemBtn>
      )}
    </div>
  );
}
