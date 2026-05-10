import { act, renderHook } from "@testing-library/react";
import { useNotification } from "../use-notification";
import { NOTIFICATION_TIMINGS } from "@/couple/_constants/animation";

describe("useNotification", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should have no notification on initial render", () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notification).toBeNull();
    expect(result.current.notifLeaving).toBe(false);
    expect(typeof result.current.notify).toBe("function");
  });

  it("should set the notification when notify is called", () => {
    const { result } = renderHook(() => useNotification());
    act(() => {
      result.current.notify("Saved", "success");
    });
    expect(result.current.notification).toEqual({
      message: "Saved",
      type: "success",
    });
    expect(result.current.notifLeaving).toBe(false);
  });

  it("should trigger leave animation after displayMs and clear after fadeOutMs", () => {
    const { result } = renderHook(() => useNotification());
    act(() => {
      result.current.notify("Done", "success");
    });

    // Advance to the displayMs boundary — leave flag flips on.
    act(() => {
      jest.advanceTimersByTime(NOTIFICATION_TIMINGS.displayMs);
    });
    expect(result.current.notifLeaving).toBe(true);
    expect(result.current.notification).not.toBeNull();

    // Advance through the fade-out — notification clears.
    act(() => {
      jest.advanceTimersByTime(NOTIFICATION_TIMINGS.fadeOutMs);
    });
    expect(result.current.notification).toBeNull();
  });

  it("should reset timers when notify is called again before timeout", () => {
    const { result } = renderHook(() => useNotification());
    act(() => {
      result.current.notify("First", "success");
    });
    act(() => {
      jest.advanceTimersByTime(NOTIFICATION_TIMINGS.displayMs - 100);
    });

    act(() => {
      result.current.notify("Second", "error");
    });
    expect(result.current.notification).toEqual({
      message: "Second",
      type: "error",
    });
    expect(result.current.notifLeaving).toBe(false);

    // Old timer should have been cleared — leave should NOT fire after only 100ms more.
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.notifLeaving).toBe(false);
  });
});
