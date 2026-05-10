import { NOTIFICATION_TIMINGS } from "../animation";

describe("animation constants", () => {
  it("should export NOTIFICATION_TIMINGS as an object", () => {
    expect(NOTIFICATION_TIMINGS).toBeDefined();
    expect(typeof NOTIFICATION_TIMINGS).toBe("object");
  });

  it("should have a positive numeric displayMs", () => {
    expect(typeof NOTIFICATION_TIMINGS.displayMs).toBe("number");
    expect(NOTIFICATION_TIMINGS.displayMs).toBeGreaterThan(0);
  });

  it("should have a positive numeric fadeOutMs", () => {
    expect(typeof NOTIFICATION_TIMINGS.fadeOutMs).toBe("number");
    expect(NOTIFICATION_TIMINGS.fadeOutMs).toBeGreaterThan(0);
  });

  it("should have displayMs longer than fadeOutMs", () => {
    expect(NOTIFICATION_TIMINGS.displayMs).toBeGreaterThan(
      NOTIFICATION_TIMINGS.fadeOutMs,
    );
  });
});
