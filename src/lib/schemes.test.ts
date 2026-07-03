import { describe, it, expect } from "vitest";
import {
  isHexColor,
  normalizeHexColor,
  isNamedScheme,
  resolveScheme,
  schemeCssVars,
  GREEN_SCHEME,
  PURPLE_SCHEME,
  ORANGE_SCHEME,
  type SchemeSurfaces,
} from "./schemes";

// ── WCAG contrast math (test-local, pure) — the derived surface palette must keep AA contrast
//    BY CONSTRUCTION for every scheme hue, so text on the tinted page never regresses. ──────────
function srgbChannel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}
function contrast(fgHex: string, bgHex: string): number {
  const a = luminance(fgHex);
  const b = luminance(bgHex);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function channels(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

describe("isHexColor", () => {
  it.each(["#7a3dff", "7a3dff", "#FF00DE", "abcdef"])("accepts %s", (v) => {
    expect(isHexColor(v)).toBe(true);
  });
  it.each(["#7a3df", "#7a3dfff", "zzzzzz", "", null, undefined, "#123"])("rejects %s", (v) => {
    expect(isHexColor(v)).toBe(false);
  });
});

describe("normalizeHexColor", () => {
  it("adds the # and lowercases", () => {
    expect(normalizeHexColor("7A3DFF")).toBe("#7a3dff");
    expect(normalizeHexColor("#FF00DE")).toBe("#ff00de");
  });
  it("returns null for invalid input", () => {
    expect(normalizeHexColor("nope")).toBeNull();
    expect(normalizeHexColor("")).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
  });
});

describe("isNamedScheme", () => {
  it("accepts green, purple and orange", () => {
    expect(isNamedScheme("green")).toBe(true);
    expect(isNamedScheme("purple")).toBe(true);
    expect(isNamedScheme("orange")).toBe(true);
  });
  it("rejects custom / hex / junk", () => {
    expect(isNamedScheme("custom")).toBe(false);
    expect(isNamedScheme("#7a3dff")).toBe(false);
    expect(isNamedScheme("")).toBe(false);
  });
});

describe("resolveScheme", () => {
  it("resolves the green named scheme", () => {
    expect(resolveScheme("green")).toEqual(GREEN_SCHEME);
  });
  it("resolves the purple named scheme (DIG brand)", () => {
    expect(resolveScheme("purple")).toEqual(PURPLE_SCHEME);
    expect(PURPLE_SCHEME.gradientFrom).toBe("#7a3dff");
    expect(PURPLE_SCHEME.gradientTo).toBe("#ff00de");
  });
  it("resolves the orange named scheme (HOA brand)", () => {
    expect(resolveScheme("orange")).toEqual(ORANGE_SCHEME);
    expect(ORANGE_SCHEME.name).toBe("orange");
    expect(ORANGE_SCHEME.gradientFrom).toMatch(/^#[0-9a-f]{6}$/);
    expect(ORANGE_SCHEME.gradientTo).toMatch(/^#[0-9a-f]{6}$/);
  });
  it("builds a custom scheme from a hex accent with a derived gradient + shadow", () => {
    const s = resolveScheme("#7a3dff");
    expect(s.name).toBe("custom");
    expect(s.gradientFrom).toBe("#7a3dff");
    expect(s.gradientTo).toMatch(/^#[0-9a-f]{6}$/);
    expect(s.gradientTo).not.toBe(s.gradientFrom); // darkened
    expect(s.shadow).toMatch(/^rgba\(\d+,\d+,\d+,0?\.\d+\)$/);
  });
  it("falls back to green for invalid / empty selectors", () => {
    expect(resolveScheme("nonsense")).toEqual(GREEN_SCHEME);
    expect(resolveScheme("")).toEqual(GREEN_SCHEME);
    expect(resolveScheme(null)).toEqual(GREEN_SCHEME);
  });
});

// ── The full-page surface palette: every scheme carries its WHOLE surface set (bg, cards, wells,
//    borders, muted text …) as shades of the scheme hue — the jar page paints with these instead
//    of the site's fixed green-dark tokens. ────────────────────────────────────────────────────
describe("scheme surfaces (full-page palette)", () => {
  const HEX = /^#[0-9a-f]{6}$/;
  const RGBA = /^rgba\(\d+,\d+,\d+,0?\.\d+\)$/;

  function expectFullSurfaceSet(s: SchemeSurfaces) {
    for (const key of [
      "bg",
      "well",
      "surface",
      "surfaceRaised",
      "border",
      "borderStrong",
      "textMuted",
      "textFaint",
      "accentText",
      "accentTextHi",
    ] as const) {
      expect(s[key]).toMatch(HEX);
    }
    for (const key of ["accentSoft", "accentLine", "ambient", "ambientSoft"] as const) {
      expect(s[key]).toMatch(RGBA);
    }
  }

  it("every named scheme + a custom accent resolves a full surface set", () => {
    expectFullSurfaceSet(GREEN_SCHEME.surfaces);
    expectFullSurfaceSet(PURPLE_SCHEME.surfaces);
    expectFullSurfaceSet(ORANGE_SCHEME.surfaces);
    expectFullSurfaceSet(resolveScheme("#f5b642").surfaces);
  });

  it("surfaces are shades of the scheme hue (purple bg reads violet, orange warm, green green)", () => {
    // Purple: the page background's blue channel dominates green (dark violet, NOT green-tinted).
    const p = channels(PURPLE_SCHEME.surfaces.bg);
    expect(p.b).toBeGreaterThan(p.g);
    expect(p.r).toBeGreaterThan(p.g); // violet = red + blue over green
    // Orange: warm — red over green over blue.
    const o = channels(ORANGE_SCHEME.surfaces.bg);
    expect(o.r).toBeGreaterThan(o.g);
    expect(o.g).toBeGreaterThan(o.b);
    // Green: the green channel dominates.
    const g = channels(GREEN_SCHEME.surfaces.bg);
    expect(g.g).toBeGreaterThan(g.r);
    expect(g.g).toBeGreaterThan(g.b);
  });

  it("surfaces are dark and layered: well < bg < surface < surfaceRaised < border < borderStrong", () => {
    for (const scheme of [GREEN_SCHEME, PURPLE_SCHEME, ORANGE_SCHEME, resolveScheme("#7a3dff")]) {
      const s = scheme.surfaces;
      expect(luminance(s.bg)).toBeLessThan(0.02); // deep dark page base
      expect(luminance(s.well)).toBeLessThan(luminance(s.bg));
      expect(luminance(s.bg)).toBeLessThan(luminance(s.surface));
      expect(luminance(s.surface)).toBeLessThan(luminance(s.surfaceRaised));
      expect(luminance(s.surfaceRaised)).toBeLessThan(luminance(s.border));
      expect(luminance(s.border)).toBeLessThan(luminance(s.borderStrong));
    }
  });

  it("keeps WCAG AA contrast by construction for every scheme (including worst-case hues)", () => {
    const samples = [
      GREEN_SCHEME,
      PURPLE_SCHEME,
      ORANGE_SCHEME,
      resolveScheme("#7a3dff"),
      resolveScheme("#0000ff"), // worst-case: pure blue (lowest luminance per lightness)
      resolveScheme("#f5b642"),
      resolveScheme("#111111"), // near-black custom accent still yields readable text tints
    ];
    for (const scheme of samples) {
      const s = scheme.surfaces;
      // Muted body text on every surface it appears on.
      expect(contrast(s.textMuted, s.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(s.textMuted, s.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(s.textMuted, s.surfaceRaised)).toBeGreaterThanOrEqual(4.5);
      // Faint small-print text on the page/card/well surfaces.
      expect(contrast(s.textFaint, s.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(s.textFaint, s.well)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(s.textFaint, s.surface)).toBeGreaterThanOrEqual(4.5);
      // Accent-tinted link/CTA text on the page background.
      expect(contrast(s.accentText, s.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(s.accentTextHi, s.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("named-scheme accent values are unchanged (byte-compatible with the widget's copy)", () => {
    // Adding surfaces must NOT alter the accent contract xch-tip.js mirrors byte-for-byte.
    expect(GREEN_SCHEME.gradientFrom).toBe("#3ab54a");
    expect(GREEN_SCHEME.gradientTo).toBe("#1f8f3a");
    expect(PURPLE_SCHEME.gradientFrom).toBe("#7a3dff");
    expect(PURPLE_SCHEME.gradientTo).toBe("#ff00de");
    expect(ORANGE_SCHEME.gradientFrom).toBe("#ff8c1a");
    expect(ORANGE_SCHEME.gradientTo).toBe("#e05a00");
  });
});

describe("schemeCssVars", () => {
  it("maps the accent trio + the full surface set onto --jar-* custom properties", () => {
    const vars = schemeCssVars(PURPLE_SCHEME);
    expect(vars["--jar-accent"]).toBe(PURPLE_SCHEME.gradientFrom);
    expect(vars["--jar-accent-2"]).toBe(PURPLE_SCHEME.gradientTo);
    expect(vars["--jar-glow"]).toBe(PURPLE_SCHEME.shadow);
    expect(vars["--jar-bg"]).toBe(PURPLE_SCHEME.surfaces.bg);
    expect(vars["--jar-well"]).toBe(PURPLE_SCHEME.surfaces.well);
    expect(vars["--jar-surface"]).toBe(PURPLE_SCHEME.surfaces.surface);
    expect(vars["--jar-surface-raised"]).toBe(PURPLE_SCHEME.surfaces.surfaceRaised);
    expect(vars["--jar-border"]).toBe(PURPLE_SCHEME.surfaces.border);
    expect(vars["--jar-border-strong"]).toBe(PURPLE_SCHEME.surfaces.borderStrong);
    expect(vars["--jar-text-muted"]).toBe(PURPLE_SCHEME.surfaces.textMuted);
    expect(vars["--jar-text-faint"]).toBe(PURPLE_SCHEME.surfaces.textFaint);
    expect(vars["--jar-accent-text"]).toBe(PURPLE_SCHEME.surfaces.accentText);
    expect(vars["--jar-accent-text-hi"]).toBe(PURPLE_SCHEME.surfaces.accentTextHi);
    expect(vars["--jar-accent-soft"]).toBe(PURPLE_SCHEME.surfaces.accentSoft);
    expect(vars["--jar-accent-line"]).toBe(PURPLE_SCHEME.surfaces.accentLine);
    expect(vars["--jar-ambient"]).toBe(PURPLE_SCHEME.surfaces.ambient);
    expect(vars["--jar-ambient-2"]).toBe(PURPLE_SCHEME.surfaces.ambientSoft);
  });
});
