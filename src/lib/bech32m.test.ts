import { describe, it, expect } from "vitest";
import { decodeBech32m, isChiaAddress } from "./bech32m";

// A real, valid mainnet XCH address (bech32m over a 32-byte puzzle hash of all-0x01).
const VALID_XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const VALID_TXCH = "txch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszf0rpn";

describe("decodeBech32m", () => {
  it("decodes a valid xch address to a 32-byte payload", () => {
    const decoded = decodeBech32m(VALID_XCH);
    expect(decoded).not.toBeNull();
    expect(decoded?.hrp).toBe("xch");
    expect(decoded?.bytes.length).toBe(32);
    expect(decoded?.hex).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects a bad checksum", () => {
    const bad = VALID_XCH.slice(0, -1) + (VALID_XCH.endsWith("e") ? "q" : "e");
    expect(decodeBech32m(bad)).toBeNull();
  });

  it("rejects mixed case", () => {
    const mixed = "Xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
    expect(decodeBech32m(mixed)).toBeNull();
  });

  it("decodes a valid txch (testnet) address", () => {
    const decoded = decodeBech32m(VALID_TXCH);
    expect(decoded?.hrp).toBe("txch");
    expect(decoded?.bytes.length).toBe(32);
  });

  it("rejects an out-of-charset character", () => {
    expect(decodeBech32m("xch1bqqqqqq")).toBeNull(); // 'b' is not in the bech32 charset
  });

  it("rejects a missing separator", () => {
    expect(decodeBech32m("xchqqqqqqqqqq")).toBeNull();
  });

  it("rejects empty / null / non-strings", () => {
    expect(decodeBech32m("")).toBeNull();
    expect(decodeBech32m(null)).toBeNull();
    expect(decodeBech32m(undefined)).toBeNull();
    expect(decodeBech32m(123 as unknown)).toBeNull();
  });

  it("rejects a too-short string", () => {
    expect(decodeBech32m("xch1q")).toBeNull();
  });
});

describe("isChiaAddress", () => {
  it("accepts a valid xch mainnet address", () => {
    expect(isChiaAddress(VALID_XCH)).toBe(true);
  });

  it("accepts an uppercase form of a valid address (single case)", () => {
    expect(isChiaAddress(VALID_XCH.toUpperCase())).toBe(true);
  });

  it("rejects a non-xch/txch HRP even with a valid checksum", () => {
    // bc1… (bitcoin) is valid bech32m but not a Chia HRP.
    expect(isChiaAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe(false);
  });

  it("rejects malformed / empty input", () => {
    expect(isChiaAddress("not-an-address")).toBe(false);
    expect(isChiaAddress("")).toBe(false);
    expect(isChiaAddress(null)).toBe(false);
  });
});
