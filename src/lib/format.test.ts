import { describe, it, expect } from "vitest";
import { shortenMiddle } from "./format";

const XCH_ADDR = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

describe("shortenMiddle", () => {
  it("keeps the head + tail and elides the middle of a long address", () => {
    const out = shortenMiddle(XCH_ADDR);
    expect(out.startsWith("xch1qyqs")).toBe(true);
    expect(out.endsWith("s0wg4qq")).toBe(true);
    expect(out).toContain("…");
    expect(out.length).toBeLessThan(30);
  });

  it("returns a short string unchanged (nothing to elide)", () => {
    expect(shortenMiddle("xch1abc")).toBe("xch1abc");
    expect(shortenMiddle("")).toBe("");
  });

  it("honors custom lead/tail lengths", () => {
    expect(shortenMiddle("abcdefghijklmnop", 3, 3)).toBe("abc…nop");
  });

  it("coerces nullish input to an empty string", () => {
    expect(shortenMiddle(null)).toBe("");
    expect(shortenMiddle(undefined)).toBe("");
  });
});
