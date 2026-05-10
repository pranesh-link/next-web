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
  /** Programmatically surface a toast notification. */
  showNotification: (n: WellnessNotification) => void;
  clearNotification: () => void;
  /** The signed-in user's id (from subjects). */
  currentUserId: string | null;
  saveMetric: (input: SaveMetricInput) => Promise<void>;
  /** Edit only the weight of an existing metric (keeps date + height). */
  editMetricWeight: (metricId: string, newWeight: number) => Promise<void>;
  removeMetric: (id: string) => Promise<void>;
  updateProfile: (patch: UpdateProfilePatch) => Promise<void>;
  refresh: () => Promise<void>;
}

/** Coerce an unknown value (Prisma Decimal or number) to a JS number. */
function toNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Extract a readable error message from an unknown thrown value. */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Data + mutations hook backing the wellness tracker page. */
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
  const showNotification = useCallback((n: WellnessNotification) => setNotification(n), []);

  const fetchSubjectData = useCallback(async (subjectId: string) => {
    // Independent fetches — a failure on one (e.g. profile) must not
    // discard the other and must not leave stale data from a prior subject.
    const [metricsRes, profileRes] = await Promise.allSettled([
      listBodyMetricsAction({ subjectId }),
      getBodyProfileAction(subjectId),
    ]);
    setMetrics(metricsRes.status === "fulfilled" ? metricsRes.value : []);
    setProfile(profileRes.status === "fulfilled" ? profileRes.value : null);
    if (metricsRes.status === "rejected") throw metricsRes.reason;
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
    // Clear stale data immediately so a failed fetch can never bleed
    // the previous subject's metrics/profile into the new tab.
    setMetrics([]);
    setProfile(null);
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

  const editMetricWeight = useCallback(
    async (metricId: string, newWeight: number) => {
      if (!selectedSubjectId) return;
      const target = metrics.find((m) => m.id === metricId);
      if (!target) return;
      setSaving(true);
      try {
        await upsertBodyMetricAction({
          subjectId: target.subjectId,
          measuredOn: new Date(target.measuredOn),
          weightInKg: newWeight,
          heightInCm: Number(target.heightInCm),
        });
        await fetchSubjectData(selectedSubjectId);
        setNotification({ type: "success", message: "Weight updated" });
      } catch (err) {
        setNotification({ type: "error", message: errorMessage(err, "Update failed") });
      } finally {
        setSaving(false);
      }
    },
    [selectedSubjectId, metrics, fetchSubjectData],
  );

  const currentUserId = useMemo(
    () => subjects.find((s) => s.isSelf)?.id ?? null,
    [subjects],
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
    showNotification,
    clearNotification,
    currentUserId,
    saveMetric,
    editMetricWeight,
    removeMetric,
    updateProfile,
    refresh,
  };
}
