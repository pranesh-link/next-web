jest.mock("@db", () => {
  const mockFindFirstUser = jest.fn();
  const mockFindFirstMetric = jest.fn();
  const mockFindManyMetrics = jest.fn().mockResolvedValue([]);
  const mockInsertReturning = jest.fn().mockResolvedValue([]);
  const mockOnConflictDoUpdate = jest.fn(() => ({ returning: mockInsertReturning }));
  const mockInsertValues = jest.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
  const mockInsert = jest.fn(() => ({ values: mockInsertValues }));
  const mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
  const mockDelete = jest.fn(() => ({ where: mockDeleteWhere }));
  const mockOrderBy = jest.fn().mockResolvedValue([]);
  const mockSelectWhere = jest.fn(() => ({ orderBy: mockOrderBy }));
  const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
  const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));

  return {
    __esModule: true,
    db: {
      query: {
        users: { findFirst: mockFindFirstUser },
        bodyMetrics: { findFirst: mockFindFirstMetric, findMany: mockFindManyMetrics },
      },
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    },
    __mocks: {
      findFirstUser: mockFindFirstUser,
      findFirstMetric: mockFindFirstMetric,
      findManyMetrics: mockFindManyMetrics,
      insertReturning: mockInsertReturning,
      onConflictDoUpdate: mockOnConflictDoUpdate,
      insertValues: mockInsertValues,
      insert: mockInsert,
      deleteWhere: mockDeleteWhere,
      delete: mockDelete,
      orderBy: mockOrderBy,
      selectWhere: mockSelectWhere,
      selectFrom: mockSelectFrom,
      select: mockSelect,
    },
  };
});

jest.mock("@db/schema", () => ({
  __esModule: true,
  bodyMetrics: {},
  bodyProfiles: {},
  users: {},
}));

jest.mock("drizzle-orm", () => ({
  __esModule: true,
  eq: jest.fn((a, b) => ({ eq: [a, b] })),
  and: jest.fn((...args) => ({ and: args })),
  inArray: jest.fn((a, b) => ({ inArray: [a, b] })),
  gte: jest.fn((a, b) => ({ gte: [a, b] })),
  lte: jest.fn((a, b) => ({ lte: [a, b] })),
}), { virtual: true });

jest.mock("@/_services/finance/couple-service", () => ({
  __esModule: true,
  getCoupleIdForUser: jest.fn(),
  getUserIdsForCouple: jest.fn(),
  getCoupleMembers: jest.fn(),
}));

import {
  getCoupleIdForUser,
  getCoupleMembers,
  getUserIdsForCouple,
} from "@/_services/finance/couple-service";
import {
  deleteMetric,
  getCoupleSubjects,
  listMetrics,
  upsertMetric,
} from "../body-metric-service";
import type { BmiCategory } from "../bmi";

const m = (jest.requireMock("@db") as { __mocks: Record<string, jest.Mock> }).__mocks;
const mockedGetCoupleId = getCoupleIdForUser as jest.Mock;
const mockedGetCoupleUserIds = getUserIdsForCouple as jest.Mock;
const mockedGetCoupleMembers = getCoupleMembers as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  m.insertReturning.mockResolvedValue([{ id: "m1" }]);
});

describe("body-metric-service", () => {
  describe("upsertMetric", () => {
    it("should log metric for self when not in a couple", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);
      mockedGetCoupleId.mockResolvedValue(null);

      await upsertMetric({
        userId: "u1",
        subjectId: "u1",
        measuredOn: new Date("2026-01-01"),
        weightInKg: 70,
        heightInCm: 170,
      });

      expect(m.insert).toHaveBeenCalledTimes(1);
      const insertedValues = m.insertValues.mock.calls[0][0];
      expect(insertedValues.coupleId).toBeNull();
    });

    it("should log metric for couple partner", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1", "u2"]);
      mockedGetCoupleId.mockResolvedValue("c1");

      await upsertMetric({
        userId: "u1",
        subjectId: "u2",
        measuredOn: new Date("2026-01-02"),
        weightInKg: 60,
        heightInCm: 165,
      });

      const insertedValues = m.insertValues.mock.calls[0][0];
      expect(insertedValues.userId).toBe("u1");
      expect(insertedValues.subjectId).toBe("u2");
      expect(insertedValues.coupleId).toBe("c1");
    });

    it("should reject log when subject is not in same couple", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);
      mockedGetCoupleId.mockResolvedValue(null);

      await expect(
        upsertMetric({
          userId: "u1",
          subjectId: "stranger",
          measuredOn: new Date("2026-01-01"),
          weightInKg: 70,
          heightInCm: 170,
        }),
      ).rejects.toThrow("Forbidden");
      expect(m.insert).not.toHaveBeenCalled();
    });

    it("should upsert with the unique key for same-day overwrite", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);
      mockedGetCoupleId.mockResolvedValue(null);

      const measuredOn = new Date("2026-01-05");
      await upsertMetric({
        userId: "u1",
        subjectId: "u1",
        measuredOn,
        weightInKg: 71,
        heightInCm: 170,
      });

      const insertedValues = m.insertValues.mock.calls[0][0];
      expect(insertedValues.subjectId).toBe("u1");
      expect(insertedValues.measuredOn).toBe("2026-01-05");
      const conflictArgs = m.onConflictDoUpdate.mock.calls[0][0];
      expect(conflictArgs.set.weightInKg).toBe("71");
    });

    const bands: Array<[number, number, BmiCategory]> = [
      [50, 170, "underweight"],
      [70, 170, "healthy"],
      [80, 170, "overweight"],
      [95, 170, "obese"],
    ];
    it.each(bands)(
      "should derive bmiCategory for weight=%p height=%p",
      async (w, h, expected) => {
        mockedGetCoupleUserIds.mockResolvedValue(["u1"]);
        mockedGetCoupleId.mockResolvedValue(null);

        await upsertMetric({
          userId: "u1",
          subjectId: "u1",
          measuredOn: new Date("2026-01-01"),
          weightInKg: w,
          heightInCm: h,
        });

        const insertedValues = m.insertValues.mock.calls[0][0];
        expect(insertedValues.bmiCategory).toBe(expected);
      },
    );
  });

  describe("deleteMetric", () => {
    it("should reject delete by unauthorized user", async () => {
      m.findFirstMetric.mockResolvedValue({
        id: "m1",
        subjectId: "stranger",
      });
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);

      await expect(deleteMetric("u1", "m1")).rejects.toThrow("Forbidden");
      expect(m.delete).not.toHaveBeenCalled();
    });
  });

  describe("getCoupleSubjects", () => {
    it("should return self when user is not in a couple", async () => {
      mockedGetCoupleId.mockResolvedValue(null);
      m.findFirstUser.mockResolvedValue({
        id: "u1",
        name: "Solo",
        image: null,
      });

      const subjects = await getCoupleSubjects("u1");
      expect(subjects).toEqual([
        { id: "u1", name: "Solo", image: null, isSelf: true },
      ]);
    });

    it("should return self+partner when in couple", async () => {
      mockedGetCoupleId.mockResolvedValue("c1");
      mockedGetCoupleMembers.mockResolvedValue([
        { user: { id: "u1", name: "Me", email: "", image: null } },
        { user: { id: "u2", name: "Partner", email: "", image: null } },
      ]);

      const subjects = await getCoupleSubjects("u1");
      expect(subjects).toHaveLength(2);
      expect(subjects[0].isSelf).toBe(true);
      expect(subjects[1].isSelf).toBe(false);
      expect(subjects[1].id).toBe("u2");
    });
  });

  describe("listMetrics", () => {
    it("should query by all couple user ids when subjectId omitted", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1", "u2"]);
      m.findManyMetrics.mockResolvedValue([]);

      await listMetrics({ userId: "u1" });
      expect(m.findManyMetrics).toHaveBeenCalledTimes(1);
    });
  });
});
