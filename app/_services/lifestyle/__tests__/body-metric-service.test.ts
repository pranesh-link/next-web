jest.mock("@/_lib/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    bodyMetric: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    bodyProfile: { upsert: jest.fn(), update: jest.fn() },
  },
}));

jest.mock("@/_services/finance/couple-service", () => ({
  __esModule: true,
  getCoupleIdForUser: jest.fn(),
  getUserIdsForCouple: jest.fn(),
  getCoupleMembers: jest.fn(),
}));

import prisma from "@/_lib/prisma";
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

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
  bodyMetric: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
  };
  bodyProfile: { upsert: jest.Mock; update: jest.Mock };
};
const mockedGetCoupleId = getCoupleIdForUser as jest.Mock;
const mockedGetCoupleUserIds = getUserIdsForCouple as jest.Mock;
const mockedGetCoupleMembers = getCoupleMembers as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("body-metric-service", () => {
  describe("upsertMetric", () => {
    it("should log metric for self when not in a couple", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);
      mockedGetCoupleId.mockResolvedValue(null);
      mockedPrisma.bodyMetric.upsert.mockResolvedValue({ id: "m1" });

      await upsertMetric({
        userId: "u1",
        subjectId: "u1",
        measuredOn: new Date("2026-01-01"),
        weightInKg: 70,
        heightInCm: 170,
      });

      expect(mockedPrisma.bodyMetric.upsert).toHaveBeenCalledTimes(1);
      const call = mockedPrisma.bodyMetric.upsert.mock.calls[0][0];
      expect(call.where).toEqual({
        subjectId_measuredOn: {
          subjectId: "u1",
          measuredOn: new Date("2026-01-01"),
        },
      });
      expect(call.create.coupleId).toBeNull();
    });

    it("should log metric for couple partner", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1", "u2"]);
      mockedGetCoupleId.mockResolvedValue("c1");
      mockedPrisma.bodyMetric.upsert.mockResolvedValue({ id: "m1" });

      await upsertMetric({
        userId: "u1",
        subjectId: "u2",
        measuredOn: new Date("2026-01-02"),
        weightInKg: 60,
        heightInCm: 165,
      });

      const call = mockedPrisma.bodyMetric.upsert.mock.calls[0][0];
      expect(call.create.userId).toBe("u1");
      expect(call.create.subjectId).toBe("u2");
      expect(call.create.coupleId).toBe("c1");
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
      expect(mockedPrisma.bodyMetric.upsert).not.toHaveBeenCalled();
    });

    it("should upsert with the unique key for same-day overwrite", async () => {
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);
      mockedGetCoupleId.mockResolvedValue(null);
      mockedPrisma.bodyMetric.upsert.mockResolvedValue({ id: "m1" });

      const measuredOn = new Date("2026-01-05");
      await upsertMetric({
        userId: "u1",
        subjectId: "u1",
        measuredOn,
        weightInKg: 71,
        heightInCm: 170,
      });

      const call = mockedPrisma.bodyMetric.upsert.mock.calls[0][0];
      expect(call.where.subjectId_measuredOn).toEqual({
        subjectId: "u1",
        measuredOn,
      });
      expect(call.update.weightInKg).toBe(71);
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
        mockedPrisma.bodyMetric.upsert.mockResolvedValue({ id: "m1" });

        await upsertMetric({
          userId: "u1",
          subjectId: "u1",
          measuredOn: new Date("2026-01-01"),
          weightInKg: w,
          heightInCm: h,
        });

        const call = mockedPrisma.bodyMetric.upsert.mock.calls[0][0];
        expect(call.create.bmiCategory).toBe(expected);
      },
    );
  });

  describe("deleteMetric", () => {
    it("should reject delete by unauthorized user", async () => {
      mockedPrisma.bodyMetric.findUnique.mockResolvedValue({
        id: "m1",
        subjectId: "stranger",
      });
      mockedGetCoupleUserIds.mockResolvedValue(["u1"]);

      await expect(deleteMetric("u1", "m1")).rejects.toThrow("Forbidden");
      expect(mockedPrisma.bodyMetric.delete).not.toHaveBeenCalled();
    });
  });

  describe("getCoupleSubjects", () => {
    it("should return self when user is not in a couple", async () => {
      mockedGetCoupleId.mockResolvedValue(null);
      mockedPrisma.user.findUnique.mockResolvedValue({
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
      mockedPrisma.bodyMetric.findMany.mockResolvedValue([]);

      await listMetrics({ userId: "u1" });
      const call = mockedPrisma.bodyMetric.findMany.mock.calls[0][0];
      expect(call.where.subjectId.in).toEqual(["u1", "u2"]);
      expect(call.orderBy).toEqual({ measuredOn: "desc" });
    });
  });
});
