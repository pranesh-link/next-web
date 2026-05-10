"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteBodyMetricAction,
  getBodyProfileAction,
  getCoupleSubjectsAction,
  listBodyMetricsAction,
  updateBodyProfileAction,
  upsertBodyMetricAction,
} from "@/couple/lifestyle/_actions/body-metrics";
import {
  buildWellnessSuggestions,
  computeTrend,
  type WellnessSuggestion,
  type WellnessTrend,
} from "@/_services/lifestyle/insights";
import type {
  BodyMetricRow,
  BodyProfileRow,
  CoupleSubject,
} from "@/_services/lifestyle/body-metric-service";
import type { BmiCategory } from "@/_services/lifestyle/bmi";

/** Toast notification payload surfaced to the page. */
export interface WellnessNotification {
  type: "success" | "error";
  message: string;
}

/** Argument shape for {@link UseWellnessPageReturn.saveMetric}. */
export interface SaveMetricInput {
  measuredOn: Date;
  weightInKg: number;
  heightInCm: number;
  note?: string;
}

/** Argument shape for {@link UseWellnessPageReturn.updateProfile}. */
export interface UpdateProfilePatch {
  defaultHeightInCm?: number | null;
  targetWeightInKg?: number | null;
}

/** Return shape of {@link useWellnessPage}. */
export interface UseWellnessPageReturn {
  loading: boolean;
  error: string | null;
  subjects: CoupleSubject[];
  selectedSubjectId: string | null;
  selectSubject: (id: string) => void;
  metrics: BodyMetricRow[];
  profile: BodyProfileRow | null;
  trend: WellnessTrend;
  suggestions: WellnessSuggestion[];
  saving: boolean;
  notification: WellnessNotification | null;
  clearNotification: () => void;
  saveMetric: (input: SaveMetricInput) => Promise<void>;
  removeMetric: (id: string) => Promise<void>;
  updateProfile: (patch: UpdateProfilePatch) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Coerce an unknown value (Prisma `Decimal` or number) to a JS number.
 *
 * @param value - Raw value pulled from a Prisma row.
 * @returns Numeric representation, or `0` when the value is not finite.
 */
function toNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Extract a readable error message from an unknown thrown value.
 *
 * @param err - The caught value.
 * @param fallback - Message returned when `err` is not an `Error`.
 * @returns A safe string suitable for the notification banner.
 */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Data + mutations hook backing the wellness tracker page.
 *
 * Loads subjects on mount, keeps a single `selectedSubjectId` in state,
 * and re-fetches metrics + profile in parallel whenever the selection
 * changes. Mutations refresh the active subject's data and surface a
 * toast notification on success or failure.
 *
 * @returns Wellness page state, derived insights, and mutation handlers.
 */
export function useWellnessPage(): UseWellnessPageReturn {
  const [subjects, setSubjects] = useState<CoupleSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BodyMetricRow[]>([]);
  const [profile, setProfile] = useState<BodyProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<WellnessNotification | null>(null);

  const clearNotification = useCallback(() => setNotification(null), []);

  const fetchSubjectData = useCallback(async (subjectId: string) => {
    const [m, p] = await Promise.all([
      listBodyMetricsAction({ subjectId }),
      getBodyProfileAction(subjectId),
    ]);
    setMetrics(m);
    setProfile(p);
  }, []);

  // Initial load: subjects + default selection.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getCoupleSubjectsAction();
        if (cancelled) return;
        setSubjects(list);
        const self = list.find((s) => s.isSelf) ?? list[0] ?? null;
        setSelectedSubjectId(self?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Failed to load subjects"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-fetch when selection changes.
  useEffect(() => {
    if (!selectedSubjectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchSubjectData(selectedSubjectId);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Failed to load metrics"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSubjectId, fetchSubjectData]);

  const trend = useMemo(() => computeTrend(metrics), [metrics]);

  const currentBmi = useMemo<number>(
    () => (metrics.length > 0 ? toNumber(metrics[0].bmi) : 0),
    [metrics],
  );

  const currentCategory = useMemo<BmiCategory>(() => {
    const raw = metrics.length > 0 ? metrics[0].bmiCategory : "healthy";
    return raw as BmiCategory;
  }, [metrics]);

  const suggestions = useMemo<WellnessSuggestion[]>(
    () =>
      buildWellnessSuggestions(
        metrics,
        trend,
        profile ? { targetWeightInKg: profile.targetWeightInKg == null ? null : Number(profile.targetWeightInKg) } : null,
        currentBmi,
        currentCategory,
      ),
    [metrics, trend, profile, currentBmi, currentCategory],
  );

  const refresh = useCallback(async () => {
    if (!selectedSubjectId) return;
    await fetchSubjectData(selectedSubjectId);
  }, [selectedSubjectId, fetchSubjectData]);

  const saveMetric = useCallback(
    async (input: SaveMetricInput) => {
      if (!selectedSubjectId) return;
      setSaving(true);
      try {
        await upsertBodyMetricAction({ subjectId: selectedSubjectId, ...input });
        await fetchSubjectData(selectedSubjectId);
        setNotification({ type: "success", message: "Measurement saved" });
      } catch (err) {
        setNotification({ type: "error", message: errorMessage(err, "Save failed") });
      } finally {
        setSaving(false);
      }
    },
    [selectedSubjectId, fetchSubjectData],
  );

  const removeMetric = useCallback(
    async (id: string) => {
      try {
        await deleteBodyMetricAction(id);
        if (selectedSubjectId) await fetchSubjectData(selectedSubjectId);
        setNotification({ type: "success", message: "Measurement deleted" });
      } catch (err) {
        setNotification({ type: "error", message: errorMessage(err, "Delete failed") });
      }
    },
    [selectedSubjectId, fetchSubjectData],
  );

  const updateProfile = useCallback(
    async (patch: UpdateProfilePatch) => {
      if (!selectedSubjectId) return;
      try {
        const updated = await updateBodyProfileAction(selectedSubjectId, patch);
        setProfile(updated);
        setNotification({ type: "success", message: "Profile updated" });
      } catch (err) {
        setNotification({ type: "error", message: errorMessage(err, "Update failed") });
      }
    },
    [selectedSubjectId],
  );

  const selectSubject = useCallback((id: string) => {
    setSelectedSubjectId(id);
  }, []);

  return {
    loading,
    error,
    subjects,
    selectedSubjectId,
    selectSubject,
    metrics,
    profile,
    trend,
    suggestions,
    saving,
    notification,
    clearNotification,
    saveMetric,
    removeMetric,
    updateProfile,
    refresh,
  };
}
