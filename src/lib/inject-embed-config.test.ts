import { describe, it, expect } from "vitest";
// The pure substitution shared by the postbuild script + this test (one source of truth).
import { substituteProjectId } from "../../scripts/embed-config-lib.mjs";

describe("substituteProjectId (embed WC projectId injection)", () => {
  const PLACEHOLDER = "__XCHTIP_WC_PROJECT_ID__";
  const src = `var DEFAULT_WC_PROJECT_ID = "${PLACEHOLDER}";`;

  it("replaces the placeholder with the given projectId", () => {
    const out = substituteProjectId(src, "abc123");
    expect(out).toContain('"abc123"');
    expect(out).not.toContain(PLACEHOLDER);
  });

  it("replaces every occurrence", () => {
    const doubled = `${PLACEHOLDER} and ${PLACEHOLDER}`;
    expect(substituteProjectId(doubled, "x")).toBe("x and x");
  });

  it("leaves the source untouched for empty/blank/invalid projectId", () => {
    expect(substituteProjectId(src, "")).toBe(src);
    expect(substituteProjectId(src, "   ")).toBe(src);
    expect(substituteProjectId(src, null)).toBe(src);
    expect(substituteProjectId(src, undefined)).toBe(src);
  });

  it("trims the projectId", () => {
    expect(substituteProjectId(src, "  abc  ")).toContain('"abc"');
  });
});
