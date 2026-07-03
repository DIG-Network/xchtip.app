// catSymbol.test.ts — auto-detect a CAT's ticker symbol from its asset id via public token APIs
// (Dexie primary, Spacescan fallback), pure + injectable fetch so it is unit-tested with no network.

import { describe, it, expect, vi } from "vitest";
import { lookupCatSymbol } from "./catSymbol";
import { DIG_ASSET_ID } from "./constants";

function jsonRes(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe("lookupCatSymbol", () => {
  it("returns the DIG symbol locally without any network call for the canonical DIG tail", async () => {
    const fetchImpl = vi.fn();
    const symbol = await lookupCatSymbol(DIG_ASSET_ID, fetchImpl as unknown as typeof fetch);
    expect(symbol).toBe("$DIG");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads the code from a Dexie response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonRes({ assets: [{ code: "SBX", name: "Spacebucks" }] }),
    );
    const symbol = await lookupCatSymbol("ab".repeat(32), fetchImpl as unknown as typeof fetch);
    expect(symbol).toBe("SBX");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("dexie");
  });

  it("falls back to Spacescan when Dexie has no code", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonRes({ assets: [] }))
      .mockResolvedValueOnce(jsonRes({ symbol: "WUSDC.b", name: "Wrapped USDC" }));
    const symbol = await lookupCatSymbol("cd".repeat(32), fetchImpl as unknown as typeof fetch);
    expect(symbol).toBe("WUSDC.b");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1][0])).toContain("spacescan");
  });

  it("returns null when neither source knows the token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonRes({ assets: [] }))
      .mockResolvedValueOnce(jsonRes({}, false, 404));
    const symbol = await lookupCatSymbol("ef".repeat(32), fetchImpl as unknown as typeof fetch);
    expect(symbol).toBeNull();
  });

  it("returns null (never throws) when the network fails entirely", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    const symbol = await lookupCatSymbol("11".repeat(32), fetchImpl as unknown as typeof fetch);
    expect(symbol).toBeNull();
  });

  it("returns null for an invalid asset id without calling the network", async () => {
    const fetchImpl = vi.fn();
    expect(await lookupCatSymbol("not-hex", fetchImpl as unknown as typeof fetch)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
