import { act, renderHook } from "@testing-library/react";
import { useBmiCalculator } from "../use-bmi-calculator";

describe("useBmiCalculator", () => {
  it("should start with empty form, zero bmi, and no category", () => {
    const { result } = renderHook(() => useBmiCalculator());

    expect(result.current.formData).toEqual({ heightInCm: "", weightInKg: "" });
    expect(result.current.fieldError.heightInCm).toBe("");
    expect(result.current.fieldError.weightInKg).toBe("");
    expect(result.current.bmi).toBe(0);
    expect(result.current.category).toBeNull();
    expect(result.current.currentBand).toBeNull();
  });

  it("should compute bmi and category for valid input", () => {
    const { result } = renderHook(() => useBmiCalculator());

    act(() => result.current.onChange("heightInCm", "170"));
    act(() => result.current.onChange("weightInKg", "65"));

    // 65 / 1.7^2 ≈ 22.5
    expect(result.current.bmi).toBeGreaterThan(22);
    expect(result.current.bmi).toBeLessThan(23);
    expect(result.current.category).toBe("healthy");
    expect(result.current.currentBand?.key).toBe("healthy");
  });

  it("should set fieldError for invalid input and keep bmi at 0", () => {
    const { result } = renderHook(() => useBmiCalculator());

    act(() => result.current.onChange("heightInCm", "abc"));
    act(() => result.current.onChange("weightInKg", "65"));

    expect(result.current.fieldError.heightInCm).not.toBe("");
    expect(result.current.fieldError.weightInKg).toBe("");
    expect(result.current.bmi).toBe(0);
    expect(result.current.category).toBeNull();
  });

  it("should update the band when height changes shift bmi into a new range", () => {
    const { result } = renderHook(() => useBmiCalculator());

    act(() => result.current.onChange("heightInCm", "150"));
    act(() => result.current.onChange("weightInKg", "70"));
    // 70 / 1.5^2 ≈ 31.1 → obese
    expect(result.current.category).toBe("obese");

    act(() => result.current.onChange("heightInCm", "180"));
    // 70 / 1.8^2 ≈ 21.6 → healthy
    expect(result.current.category).toBe("healthy");
  });

  it("should clear form, errors, bmi, and category on reset", () => {
    const { result } = renderHook(() => useBmiCalculator());

    act(() => result.current.onChange("heightInCm", "170"));
    act(() => result.current.onChange("weightInKg", "65"));
    expect(result.current.bmi).toBeGreaterThan(0);

    act(() => result.current.reset());

    expect(result.current.formData).toEqual({ heightInCm: "", weightInKg: "" });
    expect(result.current.bmi).toBe(0);
    expect(result.current.category).toBeNull();
    expect(result.current.currentBand).toBeNull();
  });
});
