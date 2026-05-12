"use client";

import styled from "styled-components";
import { useCallback, useEffect, useState } from "react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  deleteNutritionLog,
  getNutritionLogs,
  getNutritionSummary,
  logNutrition,
  type NutritionLogRow,
  type NutritionSummary,
} from "../_actions/nutrition";
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

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const MealGroup = styled.div`
  margin-bottom: 20px;
`;

const MealGroupTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SectionCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/** Return today's date as YYYY-MM-DD. */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/** Group log rows by meal type. */
function groupByMeal(
  logs: NutritionLogRow[],
): Partial<Record<MealType, NutritionLogRow[]>> {
  return logs.reduce<Partial<Record<MealType, NutritionLogRow[]>>>(
    (acc, log) => {
      const key = log.mealType as MealType;
      return { ...acc, [key]: [...(acc[key] ?? []), log] };
    },
    {},
  );
}

const EMPTY_FORM = {
  mealType: "BREAKFAST",
  name: "",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  note: "",
};

/**
 * Nutrition tracker page — logs meals by type and shows daily macro summary.
 *
 * @returns Client-rendered nutrition tracking UI for `/couple/lifestyle/nutrition`.
 * @remarks Auth: inherited from the parent `/couple` layout.
 */
export default function NutritionPage() {
  const [date, setDate] = useState(todayStr());
  const [logs, setLogs] = useState<NutritionLogRow[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const [fetchedLogs, fetchedSummary] = await Promise.all([
      getNutritionLogs(date),
      getNutritionSummary(date),
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
    if (!form.name || !form.calories) return;
    setSaving(true);
    try {
      await logNutrition({
        date,
        mealType: form.mealType,
        name: form.name,
        calories: Number(form.calories),
        proteinG: form.proteinG ? Number(form.proteinG) : undefined,
        carbsG: form.carbsG ? Number(form.carbsG) : undefined,
        fatG: form.fatG ? Number(form.fatG) : undefined,
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
    await deleteNutritionLog(id);
    await load();
  }

  const grouped = groupByMeal(logs);

  return (
    <>
      <FinanceHeader
        title="Nutrition"
        action={{ label: showForm ? "Cancel" : "Add Meal", onClick: () => setShowForm((v) => !v) }}
        onRefresh={load}
      />
      <PageWrapper>
        <DateRow>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Select date"
          />
        </DateRow>

        {summary && (
          <SummaryGrid $cols={4}>
            <Card><StatLabel>Calories</StatLabel><StatValue>{Math.round(summary.totalCalories)}</StatValue></Card>
            <Card><StatLabel>Protein</StatLabel><StatValue>{Math.round(summary.totalProtein)}g</StatValue></Card>
            <Card><StatLabel>Carbs</StatLabel><StatValue>{Math.round(summary.totalCarbs)}g</StatValue></Card>
            <Card><StatLabel>Fat</StatLabel><StatValue>{Math.round(summary.totalFat)}g</StatValue></Card>
          </SummaryGrid>
        )}

        {showForm && (
          <DailyForm onSubmit={handleSubmit}>
            <Field>
              <FieldLabel>Meal type</FieldLabel>
              <SelectInput value={form.mealType} onChange={(e) => setForm((f) => ({ ...f, mealType: e.target.value }))}>
                {MEAL_TYPES.map((t) => <option key={t}>{t}</option>)}
              </SelectInput>
            </Field>
            <Field>
              <FieldLabel>Food name *</FieldLabel>
              <TextInput required placeholder="e.g. Oatmeal" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Calories *</FieldLabel>
              <TextInput required type="number" min="0" placeholder="kcal" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Protein (g)</FieldLabel>
              <TextInput type="number" min="0" placeholder="0" value={form.proteinG} onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Carbs (g)</FieldLabel>
              <TextInput type="number" min="0" placeholder="0" value={form.carbsG} onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Fat (g)</FieldLabel>
              <TextInput type="number" min="0" placeholder="0" value={form.fatG} onChange={(e) => setForm((f) => ({ ...f, fatG: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <TextInput placeholder="Optional" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            <FormActions>
              <PrimaryBtn type="submit" disabled={saving}>{saving ? "Saving…" : "Log meal"}</PrimaryBtn>
              <GhostBtn type="button" onClick={() => setShowForm(false)}>Cancel</GhostBtn>
            </FormActions>
          </DailyForm>
        )}

        {loading ? (
          <LoadingSkeleton type="card" />
        ) : (
          <SectionCard>
            {MEAL_TYPES.map((meal) => {
              const items = grouped[meal];
              if (!items?.length) return null;
              return (
                <MealGroup key={meal}>
                  <MealGroupTitle>{meal}</MealGroupTitle>
                  {items.map((log) => (
                    <LogItem key={log.id}>
                      <span>{log.name}</span>
                      <span className="meta">{Math.round(Number(log.calories))} kcal</span>
                      <DeleteBtn aria-label={`Delete ${log.name}`} onClick={() => handleDelete(log.id)}>✕</DeleteBtn>
                    </LogItem>
                  ))}
                </MealGroup>
              );
            })}
            {!logs.length && <EmptyText>No meals logged for this day.</EmptyText>}
          </SectionCard>
        )}
      </PageWrapper>
    </>
  );
}
