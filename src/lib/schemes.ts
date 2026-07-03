// schemes.ts — the named color schemes + custom-accent handling for the tip widget.
//
// A scheme drives the button + modal accent. Three named schemes ship as one-click presets:
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
};

/** The $DIG default: the DIG brand purple→magenta gradient (matches hub.dig.net dig-tip.js). */
export const PURPLE_SCHEME: ResolvedScheme = {
  name: "purple",
  gradientFrom: "#7a3dff",
  gradientTo: "#ff00de",
  text: "#ffffff",
  shadow: "rgba(122,61,255,.34)",
};

/** The HOA default: a warm orange gradient (the HOA 🍊 brand scheme). */
export const ORANGE_SCHEME: ResolvedScheme = {
  name: "orange",
  gradientFrom: "#ff8c1a",
  gradientTo: "#e05a00",
  text: "#ffffff",
  shadow: "rgba(255,140,26,.34)",
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
    return {
      name: "custom",
      gradientFrom: hex,
      gradientTo: darken(hex, 0.22),
      text: "#ffffff",
      shadow: rgbaFromHex(hex, 0.34),
    };
  }
  return GREEN_SCHEME;
}
