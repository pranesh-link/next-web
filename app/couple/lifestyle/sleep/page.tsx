"use client";

import styled from "styled-components";
import { useCallback, useEffect, useState } from "react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  deleteSleepLog,
  getSleepLogs,
  logSleep,
  type SleepLogRow,
} from "../_actions/sleep";
import {
  Card,
  DailyForm,
  DeleteBtn,
  EmptyText,
  Field,
  FieldLabel,
  FormActions,
  GhostBtn,
  PageWrapper,
  PrimaryBtn,
  StatLabel,
  StatValue,
  TextInput,
} from "../_styled-pages";

const SleepList = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SleepEntry = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
`;

const EntryInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const EntryDate = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

const EntryMeta = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const Stars = styled.span<{ $quality: number }>`
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--accent);
  white-space: nowrap;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** Format a Date as a human-readable time string (HH:MM). */
function formatTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Format a Date or date string as a short date string. */
function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Render n filled + (5-n) empty stars. */
function qualityStars(quality: number): string {
  return "★".repeat(quality) + "☆".repeat(5 - quality);
}

/** Compute the average of an array of numbers, rounded to 1 decimal place. */
function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

const EMPTY_FORM = { date: "", bedtimeAt: "", wakeAt: "", quality: "4", note: "" };

/**
 * Sleep tracker page — logs sleep sessions and displays a 7-entry history.
 *
 * @returns Client-rendered sleep tracking UI for `/couple/lifestyle/sleep`.
 * @remarks Auth: inherited from the parent `/couple` layout.
 */
export default function SleepPage() {
  const [logs, setLogs] = useState<SleepLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setLogs(await getSleepLogs(7));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.bedtimeAt || !form.wakeAt) return;
    setSaving(true);
    try {
      await logSleep({
        date: form.date,
        bedtimeAt: form.bedtimeAt,
        wakeAt: form.wakeAt,
        quality: Number(form.quality),
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
    await deleteSleepLog(id);
    await load();
  }

  const durations = logs.map((l) => l.durationMins);
  const avgDuration = avg(durations);
  const avgQuality = avg(logs.map((l) => l.quality));

  return (
    <>
      <FinanceHeader
        title="Sleep"
        action={{ label: showForm ? "Cancel" : "Log Sleep", onClick: () => setShowForm((v) => !v) }}
        onRefresh={load}
      />
      <PageWrapper>
        <SummaryRow>
          <Card>
            <StatLabel>Avg duration (7 logs)</StatLabel>
            <StatValue>{Math.floor(avgDuration / 60)}h {avgDuration % 60}m</StatValue>
          </Card>
          <Card>
            <StatLabel>Avg quality</StatLabel>
            <StatValue>{avgQuality.toFixed(1)} / 5</StatValue>
          </Card>
        </SummaryRow>

        {showForm && (
          <DailyForm onSubmit={handleSubmit}>
            <Field>
              <FieldLabel>Night date *</FieldLabel>
              <TextInput required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Bedtime *</FieldLabel>
              <TextInput required type="datetime-local" value={form.bedtimeAt} onChange={(e) => setForm((f) => ({ ...f, bedtimeAt: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Wake time *</FieldLabel>
              <TextInput required type="datetime-local" value={form.wakeAt} onChange={(e) => setForm((f) => ({ ...f, wakeAt: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Quality (1–5)</FieldLabel>
              <TextInput type="number" min="1" max="5" value={form.quality} onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <TextInput placeholder="Optional" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            <FormActions>
              <PrimaryBtn type="submit" disabled={saving}>{saving ? "Saving…" : "Log sleep"}</PrimaryBtn>
              <GhostBtn type="button" onClick={() => setShowForm(false)}>Cancel</GhostBtn>
            </FormActions>
          </DailyForm>
        )}

        {loading ? (
          <LoadingSkeleton type="card" />
        ) : (
          <SleepList>
            {logs.map((log) => {
              const mins = log.durationMins;
              return (
                <SleepEntry key={log.id}>
                  <EntryInfo>
                    <EntryDate>{formatDate(log.date)}</EntryDate>
                    <EntryMeta>
                      {formatTime(log.bedtimeAt)} → {formatTime(log.wakeAt)} · {Math.floor(mins / 60)}h {mins % 60}m
                    </EntryMeta>
                  </EntryInfo>
                  <Stars $quality={log.quality}>{qualityStars(log.quality)}</Stars>
                  <DeleteBtn aria-label="Delete sleep log" onClick={() => handleDelete(log.id)}>✕</DeleteBtn>
                </SleepEntry>
              );
            })}
            {!logs.length && <EmptyText>No sleep logs yet. Add one above.</EmptyText>}
          </SleepList>
        )}
      </PageWrapper>
    </>
  );
}
