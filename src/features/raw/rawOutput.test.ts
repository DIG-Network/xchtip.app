import { describe, it, expect } from "vitest";
import { rawOutput } from "./rawOutput";
import { parseQueryParams } from "@/lib/embed";
import { DIG_ASSET_ID } from "@/lib/constants";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

describe("rawOutput", () => {
  it("returns the exact snippet on valid params", () => {
    const q = parseQueryParams(`?recipient=${XCH}&asset=${DIG_ASSET_ID}&scheme=purple&raw=1`);
    const r = rawOutput(q, "https://xchtip.test");
    expect(r.ok).toBe(true);
    expect(r.text).toContain("<script");
    expect(r.text).toContain(`data-asset="${DIG_ASSET_ID}"`);
    expect(r.text).toContain('data-scheme="purple"');
  });

  it("returns an ERROR line on invalid params", () => {
    const q = parseQueryParams("?recipient=bad&asset=nope&raw=1");
    const r = rawOutput(q);
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/^ERROR: invalid parameters/);
    expect(r.text).toContain("recipient:");
    expect(r.text).toContain("asset:");
  });

  it("returns an ERROR line when nothing is provided", () => {
    const q = parseQueryParams("?raw=1");
    const r = rawOutput(q);
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/^ERROR:/);
  });
});
