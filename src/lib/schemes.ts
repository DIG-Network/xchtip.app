// schemes.ts — the named color schemes + custom-accent handling for the tip widget.
//
// A scheme drives the button + modal accent AND (via `surfaces`/schemeCssVars) the FULL surface
// palette a hosted page themes itself with. Three named schemes ship as one-click presets:
//   • green  — the default XCH scheme (Chia's green).
//   • purple — the DIG brand scheme (gradient #7a3dff→#ff00de over a dark #16131f card),
//              matching the DIG brand tokens used in hub.dig.net (dig-tip.js).
//   • orange — the HOA brand scheme (a warm orange gradient), paired with the 🍊 mark.
// A "custom" scheme is any 6-hex accent color the builder user picks; the widget derives a
// gradient + shadow from it. This module is PURE (no DOM) so it is unit-testable and inlined
// verbatim into the standalone embed snippet.

/** A resolved, render-ready color scheme (the values the widget paints with). */
export interface ResolvedScheme {
  /** The canonical scheme name echoed into the embed snippet (`green` | `purple` | `custom`). */
  readonly name: SchemeName;
  /** The gradient start color (hex, `#rrggbb`). */
  readonly gradientFrom: string;
  /** The gradient end color (hex, `#rrggbb`). */
  readonly gradientTo: string;
  /** The button text color (hex) — always high-contrast against the gradient. */
  readonly text: string;
  /** The rgba() box-shadow color for the button glow. */
  readonly shadow: string;
  /** The FULL-PAGE surface palette — every page surface/neutral as a shade of the scheme hue. */
  readonly surfaces: SchemeSurfaces;
}

/**
 * The full-page surface palette derived from a scheme's accent: everything a hosted page (the
 * tip-jar landing) paints — background, cards, wells, hairlines, muted text — as dark,
 * desaturated SHADES of the scheme hue, so a purple jar reads purple end-to-end (dark violet
 * base, violet-tinted cards + borders), an orange jar warm amber-black, green jar green.
 *
 * All values are derived by ONE pure function (deriveSurfaces) from the accent, for named and
 * custom schemes alike — and the derivation is contrast-safe BY CONSTRUCTION: text tints are
 * lightness-pinned so `textMuted`/`textFaint`/`accentText` keep WCAG AA (≥4.5:1) on the surfaces
 * they appear on, for any accent hue (verified in schemes.test.ts).
 */
export interface SchemeSurfaces {
  /** The page background base — a deep, dark, desaturated shade of the scheme hue. */
  readonly bg: string;
  /** The deepest well (inset boxes like the TO/address chip; darker than `bg`). */
  readonly well: string;
  /** The card surface (elevated above `bg`; gradient top of the main card). */
  readonly surface: string;
  /** Raised panels/chips (amount presets) — the lightest tinted surface. */
  readonly surfaceRaised: string;
  /** Hairline borders/dividers, scheme-tinted. */
  readonly border: string;
  /** Stronger borders (chips, emphasized edges). */
  readonly borderStrong: string;
  /** Muted body text — hue-tinted toward the scheme, AA on every surface. */
  readonly textMuted: string;
  /** Faint small-print text — hue-tinted, still AA on bg/well/surface. */
  readonly textFaint: string;
  /** The accent lifted to an AA-safe text lightness (links, CTAs on the dark base). */
  readonly accentText: string;
  /** A brighter accent text tint (hover states). */
  readonly accentTextHi: string;
  /** A soft rgba() accent wash (selection, subtle fills). */
  readonly accentSoft: string;
  /** A stronger rgba() accent for tinted borders/lines. */
  readonly accentLine: string;
  /** The rgba() ambient field for page-background radial washes. */
  readonly ambient: string;
  /** A second, softer ambient wash from the gradient END color (two-tone depth). */
  readonly ambientSoft: string;
}

/** The named schemes the builder offers as presets (plus `custom` for a picked accent). */
export type SchemeName = "green" | "purple" | "orange" | "custom";

/** The XCH default: Chia green. */
export const GREEN_SCHEME: ResolvedScheme = {
  name: "green",
  gradientFrom: "#3ab54a",
  gradientTo: "#1f8f3a",
  text: "#ffffff",
  shadow: "rgba(31,143,58,.34)",
  surfaces: deriveSurfaces("#3ab54a", "#1f8f3a"),
};

/** The $DIG default: the DIG brand purple→magenta gradient (matches hub.dig.net dig-tip.js). */
export const PURPLE_SCHEME: ResolvedScheme = {
  name: "purple",
  gradientFrom: "#7a3dff",
  gradientTo: "#ff00de",
  text: "#ffffff",
  shadow: "rgba(122,61,255,.34)",
  surfaces: deriveSurfaces("#7a3dff", "#ff00de"),
};

/** The HOA default: a warm orange gradient (the HOA 🍊 brand scheme). */
export const ORANGE_SCHEME: ResolvedScheme = {
  name: "orange",
  gradientFrom: "#ff8c1a",
  gradientTo: "#e05a00",
  text: "#ffffff",
  shadow: "rgba(255,140,26,.34)",
  surfaces: deriveSurfaces("#ff8c1a", "#e05a00"),
};

const NAMED_SCHEMES: Record<Exclude<SchemeName, "custom">, ResolvedScheme> = {
  green: GREEN_SCHEME,
  purple: PURPLE_SCHEME,
  orange: ORANGE_SCHEME,
};

/** True for a `#rrggbb` or `rrggbb` 6-hex color string (case-insensitive). */
export function isHexColor(value: unknown): boolean {
  return /^#?[0-9a-f]{6}$/i.test(String(value == null ? "" : value).trim());
}

/** Normalize a hex color to lowercase `#rrggbb`, or null if it isn't a 6-hex color. */
export function normalizeHexColor(value: unknown): string | null {
  const s = String(value == null ? "" : value).trim().toLowerCase();
  const m = /^#?([0-9a-f]{6})$/.exec(s);
  return m ? `#${m[1]}` : null;
}

/** True for one of the built-in named scheme keys. */
export function isNamedScheme(value: unknown): value is Exclude<SchemeName, "custom"> {
  return value === "green" || value === "purple" || value === "orange";
}

// darken — shift each RGB channel toward black by `amount` (0..1). Used to derive a gradient
// end + shadow from a single custom accent color.
function darken(hex: string, amount: number): string {
  const n = normalizeHexColor(hex);
  if (!n) return hex;
  const r = Math.round(parseInt(n.slice(1, 3), 16) * (1 - amount));
  const g = Math.round(parseInt(n.slice(3, 5), 16) * (1 - amount));
  const b = Math.round(parseInt(n.slice(5, 7), 16) * (1 - amount));
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// rgbaFromHex — an `rgba(r,g,b,a)` string from a hex color, for the button glow shadow.
function rgbaFromHex(hex: string, alpha: number): string {
  const n = normalizeHexColor(hex);
  if (!n) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// hexToHsl / hslToHex — minimal pure conversions, so the surface palette can hold the scheme's
// HUE constant while pinning saturation/lightness to values that stay dark, tasteful, and AA.
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = normalizeHexColor(hex) ?? "#000000";
  const r = parseInt(n.slice(1, 3), 16) / 255;
  const g = parseInt(n.slice(3, 5), 16) / 255;
  const b = parseInt(n.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = Math.min(d / (1 - Math.abs(2 * l - 1)), 1);
  let h: number;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`;
}

/**
 * deriveSurfaces — the full-page surface palette from a scheme's accent gradient. ONE derivation
 * for named and custom schemes alike (no per-scheme hand-tuning fork):
 *   • Surfaces keep the accent's HUE but are deeply darkened + desaturated (sat capped at 40% and
 *     scaled by the accent's own saturation, so a near-gray custom accent yields near-gray
 *     surfaces instead of an invented tint).
 *   • Text tints are lightness-PINNED (muted 76%, faint 60%, accent text ≥72%) — high enough that
 *     WCAG AA (≥4.5:1) holds on every surface for ANY hue, including worst-case pure blue
 *     (contrast-asserted in schemes.test.ts).
 */
export function deriveSurfaces(gradientFrom: string, gradientTo: string): SchemeSurfaces {
  const { h, s, l } = hexToHsl(gradientFrom);
  const surfaceSat = Math.min(s * 0.42, 0.4);
  return {
    bg: hslToHex(h, surfaceSat, 0.07),
    well: hslToHex(h, surfaceSat, 0.05),
    surface: hslToHex(h, surfaceSat * 0.92, 0.105),
    surfaceRaised: hslToHex(h, surfaceSat * 0.85, 0.14),
    border: hslToHex(h, surfaceSat * 0.9, 0.21),
    borderStrong: hslToHex(h, surfaceSat, 0.3),
    textMuted: hslToHex(h, Math.min(s * 0.22, 0.24), 0.76),
    textFaint: hslToHex(h, Math.min(s * 0.16, 0.18), 0.6),
    accentText: hslToHex(h, s, Math.max(l, 0.72)),
    accentTextHi: hslToHex(h, s, Math.max(l, 0.82)),
    accentSoft: rgbaFromHex(gradientFrom, 0.14),
    accentLine: rgbaFromHex(gradientFrom, 0.42),
    ambient: rgbaFromHex(gradientFrom, 0.07),
    ambientSoft: rgbaFromHex(gradientTo, 0.05),
  };
}

/**
 * schemeCssVars — the `--jar-*` CSS custom-property map a hosted page sets (on `<body>`) to
 * theme its WHOLE surface to `scheme`. Consumed by the `body.jar-page` token remap in styles.css:
 * the site's base tokens (--ink/--well/--line/--paper-dim/…) are re-pointed at these vars, so
 * every existing rule re-themes without per-rule forking. One source of truth with the widget's
 * own accent painting (both start from the same resolveScheme()).
 */
export function schemeCssVars(scheme: ResolvedScheme): Record<string, string> {
  const s = scheme.surfaces;
  return {
    "--jar-accent": scheme.gradientFrom,
    "--jar-accent-2": scheme.gradientTo,
    "--jar-glow": scheme.shadow,
    "--jar-bg": s.bg,
    "--jar-well": s.well,
    "--jar-surface": s.surface,
    "--jar-surface-raised": s.surfaceRaised,
    "--jar-border": s.border,
    "--jar-border-strong": s.borderStrong,
    "--jar-text-muted": s.textMuted,
    "--jar-text-faint": s.textFaint,
    "--jar-accent-text": s.accentText,
    "--jar-accent-text-hi": s.accentTextHi,
    "--jar-accent-soft": s.accentSoft,
    "--jar-accent-line": s.accentLine,
    "--jar-ambient": s.ambient,
    "--jar-ambient-2": s.ambientSoft,
  };
}

/**
 * resolveScheme — turn a scheme selector (a named scheme, a raw hex accent, or null) into a
 * render-ready ResolvedScheme.
 *   • "green" / "purple"  → the corresponding named scheme.
 *   • a 6-hex color        → a `custom` scheme with a gradient + shadow derived from the accent.
 *   • anything else / null → the green default (fail-safe: always renders a valid button).
 */
export function resolveScheme(selector: unknown): ResolvedScheme {
  if (isNamedScheme(selector)) return NAMED_SCHEMES[selector];
  const hex = normalizeHexColor(selector);
  if (hex) {
    const gradientTo = darken(hex, 0.22);
    return {
      name: "custom",
      gradientFrom: hex,
      gradientTo,
      text: "#ffffff",
      shadow: rgbaFromHex(hex, 0.34),
      surfaces: deriveSurfaces(hex, gradientTo),
    };
  }
  return GREEN_SCHEME;
}
