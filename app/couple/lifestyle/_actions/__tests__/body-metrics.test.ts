/**
 * Unit tests for body-metric server actions.
 *
 * The auth helper and the body-metric service layer are mocked so each test
 * exercises only the validation, auth-guard and revalidation behaviour
 * inside the action wrappers.
 */
import { revalidatePath } from "next/cache";
import { auth } from "@/_lib/auth";
import {
  deleteMetric,
  getCoupleSubjects,
  getOrCreateProfile,
  listMetrics,
  updateProfile,
  upsertMetric,
} from "@/_services/lifestyle/body-metric-service";
import {
  deleteBodyMetricAction,
  getBodyProfileAction,
  getCoupleSubjectsAction,
  listBodyMetricsAction,
  updateBodyProfileAction,
  upsertBodyMetricAction,
} from "../body-metrics";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/_lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/_services/lifestyle/body-metric-service", () => ({
  listMetrics: jest.fn(),
  upsertMetric: jest.fn(),
  deleteMetric: jest.fn(),
  getCoupleSubjects: jest.fn(),
  getOrCreateProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedRevalidate = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockedListMetrics = listMetrics as jest.MockedFunction<typeof listMetrics>;
const mockedUpsertMetric = upsertMetric as jest.MockedFunction<typeof upsertMetric>;
const mockedDeleteMetric = deleteMetric as jest.MockedFunction<typeof deleteMetric>;
const mockedGetCoupleSubjects = getCoupleSubjects as jest.MockedFunction<typeof getCoupleSubjects>;
const mockedGetOrCreateProfile = getOrCreateProfile as jest.MockedFunction<typeof getOrCreateProfile>;
const mockedUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SUBJECT_ID = "22222222-2222-4222-8222-222222222222";
const VALID_SESSION = { user: { id: USER_ID } } as Awaited<ReturnType<typeof auth>>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedAuth.mockResolvedValue(VALID_SESSION);
});

describe("listBodyMetricsAction", () => {
  it("should call listMetrics with userId and no filters when input is empty", async () => {
    const rows = [{ id: "m1" }] as Awaited<ReturnType<typeof listMetrics>>;
    mockedListMetrics.mockResolvedValue(rows);
    const result = await listBodyMetricsAction({});
    expect(mockedListMetrics).toHaveBeenCalledWith({ userId: USER_ID });
    expect(result).toBe(rows);
  });

  it("should pass subjectId and date range to listMetrics when provided", async () => {
    mockedListMetrics.mockResolvedValue([]);
    const from = "2026-01-01";
    const to = "2026-02-01";
    await listBodyMetricsAction({ subjectId: SUBJECT_ID, from, to } as never);
    expect(mockedListMetrics).toHaveBeenCalledWith({
      userId: USER_ID,
      subjectId: SUBJECT_ID,
      from: new Date(from),
      to: new Date(to),
    });
  });

  it("should throw Unauthorized when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(listBodyMetricsAction({})).rejects.toThrow("Unauthorized");
    expect(mockedListMetrics).not.toHaveBeenCalled();
  });

  it("should throw and skip the service when the date filter is invalid", async () => {
    await expect(
      listBodyMetricsAction({ from: "not-a-date" } as never),
    ).rejects.toThrow();
    expect(mockedListMetrics).not.toHaveBeenCalled();
  });
});

describe("upsertBodyMetricAction", () => {
  const validInput = {
    subjectId: SUBJECT_ID,
    measuredOn: new Date("2026-03-01"),
    weightInKg: 70,
    heightInCm: 175,
    note: "after-run",
  };

  it("should call upsertMetric with the parsed payload and revalidate", async () => {
    const row = { id: "m2" } as Awaited<ReturnType<typeof upsertMetric>>;
    mockedUpsertMetric.mockResolvedValue(row);
    const result = await upsertBodyMetricAction(validInput);
    expect(mockedUpsertMetric).toHaveBeenCalledWith({ userId: USER_ID, ...validInput });
    expect(mockedRevalidate).toHaveBeenCalledWith("/couple/lifestyle/wellness");
    expect(result).toBe(row);
  });

  it("should throw Unauthorized when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(upsertBodyMetricAction(validInput)).rejects.toThrow("Unauthorized");
    expect(mockedUpsertMetric).not.toHaveBeenCalled();
  });

  it("should throw and skip the service when weight is out of range", async () => {
    await expect(
      upsertBodyMetricAction({ ...validInput, weightInKg: 1000 }),
    ).rejects.toThrow();
    expect(mockedUpsertMetric).not.toHaveBeenCalled();
    expect(mockedRevalidate).not.toHaveBeenCalled();
  });
});

describe("deleteBodyMetricAction", () => {
  it("should call deleteMetric with userId and metricId and revalidate", async () => {
    mockedDeleteMetric.mockResolvedValue(undefined);
    await deleteBodyMetricAction("metric-1");
    expect(mockedDeleteMetric).toHaveBeenCalledWith(USER_ID, "metric-1");
    expect(mockedRevalidate).toHaveBeenCalledWith("/couple/lifestyle/wellness");
  });

  it("should throw Unauthorized when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(deleteBodyMetricAction("metric-1")).rejects.toThrow("Unauthorized");
    expect(mockedDeleteMetric).not.toHaveBeenCalled();
  });

  it("should throw Invalid metric id when id is empty", async () => {
    await expect(deleteBodyMetricAction("")).rejects.toThrow("Invalid metric id");
    expect(mockedDeleteMetric).not.toHaveBeenCalled();
    expect(mockedRevalidate).not.toHaveBeenCalled();
  });
});

describe("getCoupleSubjectsAction", () => {
  it("should return the subjects from the service", async () => {
    const subjects = [
      { id: USER_ID, name: "Me", image: null, isSelf: true },
    ];
    mockedGetCoupleSubjects.mockResolvedValue(subjects);
    const result = await getCoupleSubjectsAction();
    expect(mockedGetCoupleSubjects).toHaveBeenCalledWith(USER_ID);
    expect(result).toBe(subjects);
  });

  it("should throw Unauthorized when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(getCoupleSubjectsAction()).rejects.toThrow("Unauthorized");
    expect(mockedGetCoupleSubjects).not.toHaveBeenCalled();
  });
});

describe("getBodyProfileAction", () => {
  it("should call getOrCreateProfile with userId and subjectId", async () => {
    const profile = { id: "p1" } as Awaited<ReturnType<typeof getOrCreateProfile>>;
    mockedGetOrCreateProfile.mockResolvedValue(profile);
    const result = await getBodyProfileAction(SUBJECT_ID);
    expect(mockedGetOrCreateProfile).toHaveBeenCalledWith(USER_ID, SUBJECT_ID);
    expect(result).toBe(profile);
  });

  it("should throw Unauthorized when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(getBodyProfileAction(SUBJECT_ID)).rejects.toThrow("Unauthorized");
    expect(mockedGetOrCreateProfile).not.toHaveBeenCalled();
  });

  it("should throw Invalid subject id when uuid is malformed", async () => {
    await expect(getBodyProfileAction("not-a-uuid")).rejects.toThrow("Invalid subject id");
    expect(mockedGetOrCreateProfile).not.toHaveBeenCalled();
  });
});

describe("updateBodyProfileAction", () => {
  const validPatch = {
    defaultHeightInCm: 180,
    targetWeightInKg: 75,
    birthDate: new Date("1990-01-01"),
    sex: "male",
  };

  it("should call updateProfile with normalized patch and revalidate", async () => {
    const row = { id: "p2" } as Awaited<ReturnType<typeof updateProfile>>;
    mockedUpdateProfile.mockResolvedValue(row);
    const result = await updateBodyProfileAction(SUBJECT_ID, validPatch);
    expect(mockedUpdateProfile).toHaveBeenCalledWith(USER_ID, SUBJECT_ID, {
      defaultHeightInCm: 180,
      targetWeightInKg: 75,
      birthDate: validPatch.birthDate,
      sex: "male",
    });
    expect(mockedRevalidate).toHaveBeenCalledWith("/couple/lifestyle/wellness");
    expect(result).toBe(row);
  });

  it("should throw Unauthorized when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(updateBodyProfileAction(SUBJECT_ID, validPatch)).rejects.toThrow("Unauthorized");
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
  });

  it("should throw Invalid subject id when uuid is malformed", async () => {
    await expect(
      updateBodyProfileAction("bad-uuid", validPatch),
    ).rejects.toThrow("Invalid subject id");
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
  });

  it("should throw and skip the service when target weight is out of range", async () => {
    await expect(
      updateBodyProfileAction(SUBJECT_ID, { ...validPatch, targetWeightInKg: 1 }),
    ).rejects.toThrow();
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
    expect(mockedRevalidate).not.toHaveBeenCalled();
  });
});
