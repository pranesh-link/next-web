import {
  BMIRange,
  categoryFromBmi,
  getBMI,
  getBMIRangePercentForGauge,
  getCurrentBMIRange,
  getWeightSuggestConfig,
  validateBMIFieldInputForRanges,
  validateBMIFields,
} from "../bmi";
import { IFormField } from "@/_store/profile/types";

const ranges: BMIRange[] = [
  { id: "underweight", name: "underweight", max: 18.5, prefixedPercentile: 0 },
  { id: "normal", name: "healthy", min: 18.5, max: 24.9, prefixedPercentile: 20 },
  { id: "overweight", name: "overweight", min: 25, max: 29.9, prefixedPercentile: 40 },
  { id: "obese", name: "obese", min: 30, prefixedPercentile: 60 },
];

describe("lifestyle/bmi", () => {
  describe("getCurrentBMIRange", () => {
    it("should return underweight range for BMI < 18.5", () => {
      expect(getCurrentBMIRange(ranges, 17).id).toBe("underweight");
    });
    it("should return normal range for BMI 18.5-24.9", () => {
      expect(getCurrentBMIRange(ranges, 22).id).toBe("normal");
    });
    it("should return overweight range for BMI 25-29.9", () => {
      expect(getCurrentBMIRange(ranges, 27).id).toBe("overweight");
    });
    it("should return obese range for BMI >= 30", () => {
      expect(getCurrentBMIRange(ranges, 35).id).toBe("obese");
    });
  });

  describe("getBMI", () => {
    it("should compute BMI for normal values", () => {
      expect(getBMI({ heightInCm: "170", weightInKg: "70" })).toBe(24.2);
    });
    it("should compute BMI for underweight", () => {
      expect(getBMI({ heightInCm: "180", weightInKg: "55" })).toBe(17.0);
    });
    it("should compute BMI for overweight", () => {
      expect(getBMI({ heightInCm: "165", weightInKg: "80" })).toBe(29.4);
    });
    it("should accept numeric inputs", () => {
      expect(getBMI({ heightInCm: 170, weightInKg: 70 })).toBe(24.2);
    });
  });

  describe("getBMIRangePercentForGauge", () => {
    it("should return 0.2 at start of normal", () => {
      expect(getBMIRangePercentForGauge(ranges[1], 18.5)).toBe(0.2);
    });
    it("should return 0.4 at end of normal", () => {
      expect(getBMIRangePercentForGauge(ranges[1], 24.9)).toBe(0.4);
    });
  });

  describe("validateBMIFields", () => {
    const cfg: IFormField = {
      id: "heightInCm",
      name: "heightInCm",
      type: "text",
      label: "Height",
      required: true,
      regex: "^[0-9]+$",
      placeholder: "",
    };
    it("should pass numeric input", () => {
      expect(validateBMIFields("170", cfg)).toBe("");
    });
    it("should fail non-numeric input", () => {
      expect(validateBMIFields("abc", cfg)).toBe("regexError");
    });
    it("should pass when no field config supplied", () => {
      expect(validateBMIFields("170")).toBe("");
    });
  });

  describe("validateBMIFieldInputForRanges", () => {
    it("should accept value within range", () => {
      expect(validateBMIFieldInputForRanges("170", { min: 50, max: 350 })).toBe(true);
    });
    it("should reject below min", () => {
      expect(validateBMIFieldInputForRanges("40", { min: 50, max: 350 })).toBe(false);
    });
    it("should reject above max", () => {
      expect(validateBMIFieldInputForRanges("400", { min: 50, max: 350 })).toBe(false);
    });
  });

  describe("getWeightSuggestConfig", () => {
    const labels = { ideal: "Ideal", increase: "Increase", reduce: "Reduce" };
    it("should suggest reduce for overweight", () => {
      const r = getWeightSuggestConfig(
        labels,
        { heightInCm: "170", weightInKg: "85" },
        29.4,
        ranges[1],
        false,
      );
      expect(r.weightDirection).toBe("Reduce");
      expect(r.diffToIdealWeight).toBeGreaterThan(0);
    });
    it("should suggest increase for underweight", () => {
      const r = getWeightSuggestConfig(
        labels,
        { heightInCm: "170", weightInKg: "50" },
        17.3,
        ranges[1],
        false,
      );
      expect(r.weightDirection).toBe("Increase");
      expect(r.diffToIdealWeight).toBeLessThan(0);
    });
    it("should report ideal for healthy BMI", () => {
      const r = getWeightSuggestConfig(
        labels,
        { heightInCm: "170", weightInKg: "65" },
        22.5,
        ranges[1],
        true,
      );
      expect(r.weightDirection).toBe("Ideal");
    });
    it("should fall back when bmi is zero", () => {
      const r = getWeightSuggestConfig(
        labels,
        { heightInCm: "170", weightInKg: "70" },
        0,
        ranges[1],
        false,
      );
      expect(r.weightDirection).toBe("Reduce");
      expect(r.diffToIdealWeight).toBe(0);
    });
  });

  describe("categoryFromBmi", () => {
    it("should return underweight for bmi < 18.5 with no ranges", () => {
      expect(categoryFromBmi(17)).toBe("underweight");
    });
    it("should return healthy for 18.5-24.9 with no ranges", () => {
      expect(categoryFromBmi(22)).toBe("healthy");
    });
    it("should return overweight for 25-29.9 with no ranges", () => {
      expect(categoryFromBmi(27)).toBe("overweight");
    });
    it("should return obese for >=30 with no ranges", () => {
      expect(categoryFromBmi(31)).toBe("obese");
    });
    it("should derive from name field of matched range", () => {
      expect(categoryFromBmi(22, ranges)).toBe("healthy");
      expect(categoryFromBmi(27, ranges)).toBe("overweight");
    });
  });
});
