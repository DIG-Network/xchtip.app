// useCopy tests — the shared copy hook: success flips `copied` for the confirmation window; a
// blocked clipboard is swallowed (never throws, `copied` stays false) so the UI never breaks.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopy } from "./useCopy";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCopy", () => {
  it("copies the value and flips `copied`, then resets after the window", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const { result } = renderHook(() => useCopy("hello", 1500));
    await act(async () => {
      await result.current.copy();
    });
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);

    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.copied).toBe(false);
  });

  it("swallows a blocked clipboard — never throws, stays not-copied", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const { result } = renderHook(() => useCopy("x"));
    await act(async () => {
      await result.current.copy();
    });
    expect(result.current.copied).toBe(false);
  });
});
