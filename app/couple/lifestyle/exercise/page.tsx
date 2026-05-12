"use client";

import styled from "styled-components";
import { useCallback, useEffect, useState } from "react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  deleteExerciseLog,
  getExerciseLogs,
  getWeeklyExerciseSummary,
  logExercise,
  type ExerciseLogRow,
  type WeeklyExerciseSummary,
} from "../_actions/exercise";
import {
  Card,
  DateRow,
  DailyForm,
  DeleteBtn,
  EmptyText,
  Field,
  FieldLabel,
  FormActions,
  GhostBtn,
  LogItem,
  PageWrapper,
  PrimaryBtn,
  SelectInput,
  StatLabel,
  StatValue,
  SummaryGrid,
  TextInput,
} from "../_styled-pages";

const EXERCISE_TYPES = ["CARDIO", "STRENGTH", "YOGA", "SPORTS", "OTHER"] as const;

const LogsCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LogMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const LogName = styled.span`
  font-size: 14px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LogSubtext = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

/** Return today's date as YYYY-MM-DD. */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const EMPTY_FORM = {
  type: "CARDIO",
  name: "",
  durationMins: "",
  caloriesBurned: "",
  note: "",
};

/**
 * Exercise tracker page — logs workouts and shows a 7-day activity summary.
 *
 * @returns Client-rendered exercise tracking UI for `/couple/lifestyle/exercise`.
 * @remarks Auth: inherited from the parent `/couple` layout.
 */
export default function ExercisePage() {
  const [date, setDate] = useState(todayStr());
  const [logs, setLogs] = useState<ExerciseLogRow[]>([]);
  const [summary, setSummary] = useState<WeeklyExerciseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const [fetchedLogs, fetchedSummary] = await Promise.all([
      getExerciseLogs(date),
      getWeeklyExerciseSummary(),
    ]);
    setLogs(fetchedLogs);
    setSummary(fetchedSummary);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.durationMins) return;
    setSaving(true);
    try {
      await logExercise({
        date,
        type: form.type,
        name: form.name,
        durationMins: Number(form.durationMins),
        caloriesBurned: form.caloriesBurned ? Number(form.caloriesBurned) : undefined,
        note: form.note || undefined,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteExerciseLog(id);
    await load();
  }

  return (
    <>
      <FinanceHeader
        title="Exercise"
        action={{ label: showForm ? "Cancel" : "Log Workout", onClick: () => setShowForm((v) => !v) }}
        onRefresh={load}
      />
      <PageWrapper>
        {summary && (
          <SummaryGrid $cols={3}>
            <Card><StatLabel>Weekly minutes</StatLabel><StatValue>{summary.totalMins}</StatValue></Card>
            <Card><StatLabel>Calories burned</StatLabel><StatValue>{Math.round(summary.totalCaloriesBurned)}</StatValue></Card>
            <Card><StatLabel>Days active</StatLabel><StatValue>{summary.daysActive} / 7</StatValue></Card>
          </SummaryGrid>
        )}

        <DateRow>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Select date"
          />
        </DateRow>

        {showForm && (
          <DailyForm onSubmit={handleSubmit}>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <SelectInput value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {EXERCISE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </SelectInput>
            </Field>
            <Field>
              <FieldLabel>Activity name *</FieldLabel>
              <TextInput required placeholder="e.g. Morning run" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Duration (mins) *</FieldLabel>
              <TextInput required type="number" min="1" placeholder="30" value={form.durationMins} onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Calories burned</FieldLabel>
              <TextInput type="number" min="0" placeholder="Optional" value={form.caloriesBurned} onChange={(e) => setForm((f) => ({ ...f, caloriesBurned: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <TextInput placeholder="Optional" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            <FormActions>
              <PrimaryBtn type="submit" disabled={saving}>{saving ? "Saving…" : "Log workout"}</PrimaryBtn>
              <GhostBtn type="button" onClick={() => setShowForm(false)}>Cancel</GhostBtn>
            </FormActions>
          </DailyForm>
        )}

        {loading ? (
          <LoadingSkeleton type="card" />
        ) : (
          <LogsCard>
            {logs.map((log) => (
              <LogItem key={log.id}>
                <LogMeta>
                  <LogName>{log.name}</LogName>
                  <LogSubtext>{log.type} · {log.durationMins} min{log.caloriesBurned ? ` · ${Math.round(Number(log.caloriesBurned))} kcal` : ""}</LogSubtext>
                </LogMeta>
                <DeleteBtn aria-label={`Delete ${log.name}`} onClick={() => handleDelete(log.id)}>✕</DeleteBtn>
              </LogItem>
            ))}
            {!logs.length && <EmptyText>No workouts logged for this day.</EmptyText>}
          </LogsCard>
        )}
      </PageWrapper>
    </>
  );
}
