import { EASING, EASING_CURVES } from "../theme";

describe("theme constants", () => {
  it("should export EASING as a non-empty string", () => {
    expect(typeof EASING).toBe("string");
    expect(EASING.length).toBeGreaterThan(0);
  });

  it("should export EASING_CURVES with a 'default' curve", () => {
    expect(EASING_CURVES).toBeDefined();
    expect(typeof EASING_CURVES.default).toBe("string");
    expect(EASING_CURVES.default).toMatch(/cubic-bezier/);
  });

  it("should set EASING to the default curve", () => {
    expect(EASING).toBe(EASING_CURVES.default);
  });
});
