// useCatSymbol tests — debounced CAT-symbol auto-detect with loading + detected + disabled behavior.
// Real timers (the 400ms debounce is short); the lib client is mocked so there is no network.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCatSymbol } from "./useCatSymbol";
import * as catSymbol from "@/lib/catSymbol";

vi.mock("@/lib/catSymbol", () => ({ lookupCatSymbol: vi.fn() }));
const mockLookup = vi.mocked(catSymbol.lookupCatSymbol);
const CAT = "ab".repeat(32);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCatSymbol", () => {
  it("is idle when disabled", () => {
    const { result } = renderHook(() => useCatSymbol(CAT, false));
    expect(result.current).toEqual({ detecting: false, detected: null });
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("is idle for an invalid asset id", () => {
    const { result } = renderHook(() => useCatSymbol("nothex", true));
    expect(result.current.detected).toBeNull();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("shows detecting, then resolves the detected symbol", async () => {
    mockLookup.mockResolvedValue("SBX");
    const { result } = renderHook(() => useCatSymbol(CAT, true));
    expect(result.current.detecting).toBe(true);
    await waitFor(() => expect(result.current.detected).toBe("SBX"));
    expect(result.current.detecting).toBe(false);
    expect(mockLookup).toHaveBeenCalledWith(CAT);
  });

  it("resolves to null when the lookup rejects (never throws)", async () => {
    mockLookup.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useCatSymbol(CAT, true));
    await waitFor(() => expect(result.current.detecting).toBe(false));
    expect(result.current.detected).toBeNull();
  });
});
