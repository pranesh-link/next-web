import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@/couple/lifestyle/_actions/body-metrics", () => ({
  getCoupleSubjectsAction: jest.fn(),
  listBodyMetricsAction: jest.fn(),
  getBodyProfileAction: jest.fn(),
  upsertBodyMetricAction: jest.fn(),
  deleteBodyMetricAction: jest.fn(),
  updateBodyProfileAction: jest.fn(),
}));

import {
  deleteBodyMetricAction,
  getBodyProfileAction,
  getCoupleSubjectsAction,
  listBodyMetricsAction,
  updateBodyProfileAction,
  upsertBodyMetricAction,
} from "@/couple/lifestyle/_actions/body-metrics";
import { useWellnessPage } from "../use-wellness-page";

const mockedGetSubjects = getCoupleSubjectsAction as jest.MockedFunction<
  typeof getCoupleSubjectsAction
>;
const mockedListMetrics = listBodyMetricsAction as jest.MockedFunction<
  typeof listBodyMetricsAction
>;
const mockedGetProfile = getBodyProfileAction as jest.MockedFunction<
  typeof getBodyProfileAction
>;
const mockedUpsert = upsertBodyMetricAction as jest.MockedFunction<
  typeof upsertBodyMetricAction
>;
const mockedDelete = deleteBodyMetricAction as jest.MockedFunction<
  typeof deleteBodyMetricAction
>;
const mockedUpdateProfile = updateBodyProfileAction as jest.MockedFunction<
  typeof updateBodyProfileAction
>;

const SELF_ID = "11111111-1111-1111-1111-111111111111";
const PARTNER_ID = "22222222-2222-2222-2222-222222222222";

const SUBJECTS = [
  { id: SELF_ID, name: "Me", image: null, isSelf: true },
  { id: PARTNER_ID, name: "Partner", image: null, isSelf: false },
];

function metric(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: overrides.id ?? "m1",
    userId: SELF_ID,
    subjectId: SELF_ID,
    coupleId: null,
    measuredOn: overrides.measuredOn ?? new Date("2025-01-15"),
    weightInKg: overrides.weightInKg ?? 70,
    heightInCm: overrides.heightInCm ?? 170,
    bmi: overrides.bmi ?? 24.2,
    bmiCategory: overrides.bmiCategory ?? "healthy",
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Awaited<ReturnType<typeof import("@/_services/lifestyle/body-metric-service").listMetricsForSubject>>[number];
}

const PROFILE_SELF = {
  id: "p1",
  userId: SELF_ID,
  subjectId: SELF_ID,
  coupleId: null,
  defaultHeightInCm: 170,
  targetWeightInKg: 65,
  birthDate: null,
  sex: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Awaited<ReturnType<typeof import("@/_services/lifestyle/body-metric-service").getProfileForSubject>>;

const PROFILE_PARTNER = { ...PROFILE_SELF, id: "p2", subjectId: PARTNER_ID };

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetSubjects.mockResolvedValue(SUBJECTS);
  mockedListMetrics.mockResolvedValue([metric()]);
  mockedGetProfile.mockResolvedValue(PROFILE_SELF);
});

describe("useWellnessPage", () => {
  it("should load subjects and select self by default", async () => {
    const { result } = renderHook(() => useWellnessPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subjects).toHaveLength(2);
    expect(result.current.selectedSubjectId).toBe(SELF_ID);
    expect(result.current.metrics).toHaveLength(1);
    expect(result.current.profile).toEqual(PROFILE_SELF);
    expect(mockedListMetrics).toHaveBeenCalledWith({ subjectId: SELF_ID });
    expect(mockedGetProfile).toHaveBeenCalledWith(SELF_ID);
  });

  it("should re-fetch metrics and profile when selecting a different subject", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedListMetrics.mockResolvedValueOnce([metric({ id: "m2", subjectId: PARTNER_ID })]);
    mockedGetProfile.mockResolvedValueOnce(PROFILE_PARTNER);

    act(() => result.current.selectSubject(PARTNER_ID));

    await waitFor(() => expect(result.current.selectedSubjectId).toBe(PARTNER_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedListMetrics).toHaveBeenLastCalledWith({ subjectId: PARTNER_ID });
    expect(mockedGetProfile).toHaveBeenLastCalledWith(PARTNER_ID);
    expect(result.current.profile).toEqual(PROFILE_PARTNER);
  });

  it("should save a metric, refresh data, and surface a success notification", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedUpsert.mockResolvedValueOnce(metric({ id: "new" }));
    const refreshed = [metric({ id: "new" }), metric()];
    mockedListMetrics.mockResolvedValueOnce(refreshed);
    mockedGetProfile.mockResolvedValueOnce(PROFILE_SELF);

    await act(async () => {
      await result.current.saveMetric({
        measuredOn: new Date("2025-02-01"),
        weightInKg: 71,
        heightInCm: 170,
      });
    });

    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: SELF_ID, weightInKg: 71, heightInCm: 170 }),
    );
    expect(result.current.notification).toEqual({
      type: "success",
      message: "Measurement saved",
    });
    expect(result.current.metrics).toHaveLength(2);
    expect(result.current.saving).toBe(false);
  });

  it("should surface an error notification when saveMetric throws", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedUpsert.mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      await result.current.saveMetric({
        measuredOn: new Date("2025-02-01"),
        weightInKg: 71,
        heightInCm: 170,
      });
    });

    expect(result.current.notification).toEqual({ type: "error", message: "boom" });
    expect(result.current.saving).toBe(false);
  });

  it("should call deleteBodyMetricAction and refresh on removeMetric", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedDelete.mockResolvedValueOnce(undefined);
    mockedListMetrics.mockResolvedValueOnce([]);
    mockedGetProfile.mockResolvedValueOnce(PROFILE_SELF);

    await act(async () => {
      await result.current.removeMetric("m1");
    });

    expect(mockedDelete).toHaveBeenCalledWith("m1");
    expect(result.current.metrics).toHaveLength(0);
    expect(result.current.notification?.type).toBe("success");
  });

  it("should recompute suggestions when metrics change", async () => {
    const { result, rerender } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialSuggestions = result.current.suggestions;

    // Replace metrics with overweight history → suggestion set should differ.
    mockedDelete.mockResolvedValueOnce(undefined);
    mockedListMetrics.mockResolvedValueOnce([
      metric({ id: "h1", weightInKg: 90, bmi: 31.1, bmiCategory: "obese" }),
    ]);
    mockedGetProfile.mockResolvedValueOnce(PROFILE_SELF);

    await act(async () => {
      await result.current.removeMetric("m1");
    });
    rerender();

    await waitFor(() =>
      expect(result.current.metrics[0]?.bmiCategory).toBe("obese"),
    );
    expect(result.current.suggestions).not.toEqual(initialSuggestions);
    expect(result.current.suggestions.some((s) => s.type === "danger")).toBe(true);
  });

  it("should update the profile and surface a success notification", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = { ...PROFILE_SELF, targetWeightInKg: 60 };
    mockedUpdateProfile.mockResolvedValueOnce(updated);

    await act(async () => {
      await result.current.updateProfile({ targetWeightInKg: 60 });
    });

    expect(mockedUpdateProfile).toHaveBeenCalledWith(SELF_ID, { targetWeightInKg: 60 });
    expect(result.current.profile).toEqual(updated);
    expect(result.current.notification?.type).toBe("success");
  });

  it("clearNotification resets the notification slot", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedUpsert.mockResolvedValueOnce(metric());
    mockedListMetrics.mockResolvedValueOnce([metric()]);
    mockedGetProfile.mockResolvedValueOnce(PROFILE_SELF);

    await act(async () => {
      await result.current.saveMetric({
        measuredOn: new Date(),
        weightInKg: 70,
        heightInCm: 170,
      });
    });
    expect(result.current.notification).not.toBeNull();

    act(() => result.current.clearNotification());
    expect(result.current.notification).toBeNull();
  });

  it("should not bleed previous subject's metrics when partner profile fetch fails", async () => {
    const { result } = renderHook(() => useWellnessPage());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics).toHaveLength(1);

    // Partner: metrics empty, profile rejects.
    mockedListMetrics.mockResolvedValueOnce([]);
    mockedGetProfile.mockRejectedValueOnce(new Error("forbidden"));

    act(() => result.current.selectSubject(PARTNER_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics).toHaveLength(0);
    expect(result.current.profile).toBeNull();
  });
});
