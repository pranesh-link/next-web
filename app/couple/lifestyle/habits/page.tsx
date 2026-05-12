"use client";

import styled from "styled-components";
import { useCallback, useEffect, useState } from "react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import { EASING } from "@/couple/_constants/theme";
import {
  archiveHabit,
  createHabit,
  getHabits,
  toggleHabitLog,
  type HabitWithTodayLog,
} from "../_actions/habits";
import {
  DailyForm,
  DeleteBtn,
  EmptyText,
  Field,
  FieldLabel,
  FormActions,
  GhostBtn,
  PageWrapper,
  PrimaryBtn,
  TextInput,
} from "../_styled-pages";

const HabitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const HabitCard = styled.div<{ $done: boolean }>`
  background: var(--surface);
  border: 2px solid ${(p) => (p.$done ? "var(--accent)" : "var(--border)")};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s ${EASING};
`;

const HabitTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const HabitCheckbox = styled.button<{ $done: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${(p) => (p.$done ? "var(--accent)" : "var(--border)")};
  background: ${(p) => (p.$done ? "var(--accent)" : "transparent")};
  color: #ffffff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.2s ${EASING},
    border-color 0.2s ${EASING};
`;

const HabitInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const HabitName = styled.h3`
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HabitDesc = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
`;

const HabitFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HabitTarget = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const SharedBadge = styled.span`
  font-size: 11px;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 600;
`;

const ToggleLabel = styled.label`
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`;

/** Return today's date as YYYY-MM-DD. */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const EMPTY_FORM = { name: "", description: "", targetDays: "7", isShared: false };

/**
 * Habits tracker page — shows active habits as cards with daily completion toggles.
 *
 * @returns Client-rendered habits tracking UI for `/couple/lifestyle/habits`.
 * @remarks Auth: inherited from the parent `/couple` layout.
 */
export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithTodayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const today = todayStr();

  const load = useCallback(async () => {
    setLoading(true);
    setHabits(await getHabits());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await createHabit({
        name: form.name,
        description: form.description || undefined,
        targetDays: Number(form.targetDays),
        isShared: form.isShared,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(habitId: string) {
    await toggleHabitLog(habitId, today);
    await load();
  }

  async function handleArchive(id: string) {
    await archiveHabit(id);
    await load();
  }

  return (
    <>
      <FinanceHeader
        title="Habits"
        action={{ label: showForm ? "Cancel" : "Add Habit", onClick: () => setShowForm((v) => !v) }}
        onRefresh={load}
      />
      <PageWrapper>
        {showForm && (
          <DailyForm onSubmit={handleSubmit}>
            <Field>
              <FieldLabel>Habit name *</FieldLabel>
              <TextInput required placeholder="e.g. Morning walk" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <TextInput placeholder="Optional" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Target days / week</FieldLabel>
              <TextInput type="number" min="1" max="7" value={form.targetDays} onChange={(e) => setForm((f) => ({ ...f, targetDays: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>&nbsp;</FieldLabel>
              <ToggleLabel>
                <input
                  type="checkbox"
                  checked={form.isShared}
                  onChange={(e) => setForm((f) => ({ ...f, isShared: e.target.checked }))}
                />
                Shared with partner
              </ToggleLabel>
            </Field>
            <FormActions>
              <PrimaryBtn type="submit" disabled={saving}>{saving ? "Saving…" : "Create habit"}</PrimaryBtn>
              <GhostBtn type="button" onClick={() => setShowForm(false)}>Cancel</GhostBtn>
            </FormActions>
          </DailyForm>
        )}

        {loading ? (
          <LoadingSkeleton type="card" />
        ) : habits.length ? (
          <HabitGrid>
            {habits.map((habit) => {
              const isDone = habit.logs.some((l) => l.completed);
              return (
                <HabitCard key={habit.id} $done={isDone}>
                  <HabitTop>
                    <HabitCheckbox $done={isDone} aria-label={isDone ? "Mark incomplete" : "Mark complete"} onClick={() => handleToggle(habit.id)}>
                      {isDone && "✓"}
                    </HabitCheckbox>
                    <HabitInfo>
                      <HabitName>{habit.name}</HabitName>
                      {habit.description && <HabitDesc>{habit.description}</HabitDesc>}
                    </HabitInfo>
                    <DeleteBtn aria-label={`Archive ${habit.name}`} onClick={() => handleArchive(habit.id)}>✕</DeleteBtn>
                  </HabitTop>
                  <HabitFooter>
                    <HabitTarget>{habit.targetDays}×/week</HabitTarget>
                    {habit.isShared && <SharedBadge>Shared</SharedBadge>}
                  </HabitFooter>
                </HabitCard>
              );
            })}
          </HabitGrid>
        ) : (
          <EmptyText>No active habits. Create your first habit above.</EmptyText>
        )}
      </PageWrapper>
    </>
  );
}
