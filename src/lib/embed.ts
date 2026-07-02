// embed.ts — PURE, dependency-free builder logic for xchtip.app.
//
// The builder takes a recipient + asset + color scheme + optional presets and produces (a) a
// validated config, and (b) a copyable <script> embed snippet that renders the tip button on any
// page. It also maps URL query params → the same config (so the page pre-fills from a link and, in
// raw mode, renders the machine-readable snippet only). Everything here is a pure function (no DOM,
// no network, no globals) so it is unit-tested in isolation and is the single source of truth for
// the embed data-attribute contract (mirrored by public/embed/xch-tip.js at runtime).

import { SITE_ORIGIN, EMBED_PATH, DIG_ASSET_ID, DEFAULT_DIG_PRESETS, DEFAULT_XCH_PRESETS } from "./constants";
import { isChiaAddress } from "./bech32m";
import { isNamedScheme, normalizeHexColor, type SchemeName } from "./schemes";

/** The asset a tip is paid in: native XCH, or a CAT identified by its 64-hex asset id. */
export type Asset = { kind: "xch" } | { kind: "cat"; assetId: string };

/** The validated builder config (the inputs the snippet is generated from). */
export interface TipConfig {
  /** Recipient Chia bech32m address (`xch1…`). */
  recipient: string;
  /** The asset to tip in. */
  asset: Asset;
  /** The scheme name (`green` | `purple` | `custom`). */
  scheme: SchemeName;
  /** The custom accent hex (`#rrggbb`), present only when scheme === "custom". */
  color: string | null;
  /** Amount presets (whole units of the asset), or null to use the widget defaults. */
  presets: number[] | null;
  /** Optional custom button label. */
  label: string | null;
}

/** The result of validating raw inputs into a TipConfig. */
export type ValidationResult =
  | { ok: true; config: TipConfig }
  | { ok: false; errors: ValidationErrors };

/** Field-keyed validation errors (stable keys for machine consumers + the UI). */
export interface ValidationErrors {
  recipient?: string;
  asset?: string;
  color?: string;
}

// strip0x + lowercase a hex-ish string.
function strip0x(h: unknown): string {
  return String(h == null ? "" : h).replace(/^0x/i, "").toLowerCase();
}

/** True for a bare 64-hex CAT asset id (no 0x prefix, case-insensitive). */
export function isValidCatAssetId(value: unknown): boolean {
  return /^[0-9a-f]{64}$/i.test(strip0x(value));
}

/**
 * parseAsset — normalize a raw asset selector into an Asset, or null if invalid.
 *   • "xch" (any case)      → native XCH.
 *   • a 64-hex string       → a CAT with that (lowercased, 0x-stripped) asset id.
 *   • anything else / empty → null.
 */
export function parseAsset(value: unknown): Asset | null {
  const s = String(value == null ? "" : value).trim().toLowerCase();
  if (s === "") return null;
  if (s === "xch") return { kind: "xch" };
  const id = strip0x(s);
  return isValidCatAssetId(id) ? { kind: "cat", assetId: id } : null;
}

/** The `data-asset` attribute value for an asset (`xch` or the CAT id). */
export function assetToAttr(asset: Asset): string {
  return asset.kind === "xch" ? "xch" : asset.assetId;
}

/** True when the asset is the canonical $DIG CAT. */
export function isDigAsset(asset: Asset): boolean {
  return asset.kind === "cat" && asset.assetId === DIG_ASSET_ID;
}

/** The default presets for an asset (whole units): $DIG uses [1,5,25]; other CATs [1,5,25]; XCH [0.1,0.5,1]. */
export function defaultPresetsFor(asset: Asset): number[] {
  return asset.kind === "xch" ? DEFAULT_XCH_PRESETS.slice() : DEFAULT_DIG_PRESETS.slice();
}

/** The default button label for an asset (matches the widget's default). */
export function defaultLabelFor(asset: Asset): string {
  if (asset.kind === "xch") return "Tip in XCH";
  if (isDigAsset(asset)) return "Tip in DIG";
  return "Send a tip";
}

/**
 * parsePresets — "1,5,25" → [1,5,25]. Drops non-positive / non-numeric entries; an empty /
 * all-invalid list returns null (the widget then uses the asset defaults). XCH presets may be
 * fractional (0.1); CAT presets are whole numbers but this parser preserves the given values.
 */
export function parsePresets(raw: unknown): number[] | null {
  if (raw == null) return null;
  const out: number[] = [];
  for (const part of String(raw).split(",")) {
    const t = part.trim();
    if (t === "") continue;
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out.length ? out : null;
}

// HTML-escape a value destined for a double-quoted attribute (so a quote/`<`/`&` in a label can't
// break out of the attribute or inject markup).
export function escapeHtmlAttr(s: unknown): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * validateConfig — validate raw builder inputs into a TipConfig (or field-keyed errors). The
 * recipient must be a valid bech32m Chia address; the asset must be `xch` or a 64-hex CAT id; a
 * custom color (when the scheme is custom or a hex is supplied) must be a 6-hex color.
 */
export function validateConfig(input: {
  recipient?: unknown;
  asset?: unknown;
  scheme?: unknown;
  color?: unknown;
  presets?: unknown;
  label?: unknown;
}): ValidationResult {
  const errors: ValidationErrors = {};

  const recipient = String(input.recipient == null ? "" : input.recipient).trim();
  if (!isChiaAddress(recipient)) {
    errors.recipient = "Enter a valid Chia address (starts with xch1…).";
  }

  const asset = parseAsset(input.asset);
  if (!asset) {
    errors.asset = 'Choose XCH or enter a 64-character CAT asset id (hex).';
  }

  // Resolve the scheme + optional custom color. A hex value in `scheme` OR `color` means custom.
  const { scheme, color } = resolveSchemeInput(input.scheme, input.color);
  if (color === false) {
    errors.color = "Enter a valid 6-digit hex color (e.g. #7a3dff).";
  }

  if (Object.keys(errors).length > 0 || !asset) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    config: {
      recipient,
      asset,
      scheme,
      color: color === false ? null : color,
      presets: parsePresets(input.presets),
      label: normalizeLabel(input.label),
    },
  };
}

// normalizeLabel — a trimmed non-empty label, or null (the widget then uses its default).
function normalizeLabel(raw: unknown): string | null {
  const s = String(raw == null ? "" : raw).trim();
  return s === "" ? null : s;
}

// resolveSchemeInput — decide the scheme name + custom color from the two raw inputs. `scheme` may
// be a named scheme ("green"/"purple") OR a hex color (custom); `color` supplies a custom accent.
// Returns color: string (the resolved custom hex), null (named scheme, no custom color), or false
// (a custom accent was requested but the value is not a valid hex color → a validation error).
function resolveSchemeInput(
  schemeRaw: unknown,
  colorRaw: unknown,
): { scheme: SchemeName; color: string | null | false } {
  // An explicit color input always means "custom".
  const colorStr = String(colorRaw == null ? "" : colorRaw).trim();
  if (colorStr !== "") {
    const hex = normalizeHexColor(colorStr);
    return { scheme: "custom", color: hex ?? false };
  }
  // scheme may itself be a hex (custom) or a named scheme.
  if (isNamedScheme(schemeRaw)) return { scheme: schemeRaw, color: null };
  const schemeStr = String(schemeRaw == null ? "" : schemeRaw).trim();
  if (schemeStr !== "" && schemeStr.toLowerCase() !== "green" && schemeStr.toLowerCase() !== "purple") {
    // A non-named, non-empty scheme value is treated as a custom color candidate.
    const hex = normalizeHexColor(schemeStr);
    if (hex) return { scheme: "custom", color: hex };
    // Not a hex and not a named scheme → fall back to green (the safe default), no custom color.
    return { scheme: "green", color: null };
  }
  return { scheme: "green", color: null };
}

/**
 * buildEmbedSnippet — the single self-contained <script> tag an external site drops in to render
 * the tip button. Config rides on data-* attributes parsed by public/embed/xch-tip.js at runtime.
 * The asset is served from the site origin (<origin>/embed/xch-tip.js).
 */
export function buildEmbedSnippet(config: TipConfig, origin: string = SITE_ORIGIN): string {
  const base = String(origin || SITE_ORIGIN).replace(/\/+$/, "");
  let attrs = ` src="${base}${EMBED_PATH}"`;
  attrs += ` data-recipient="${escapeHtmlAttr(config.recipient)}"`;
  attrs += ` data-asset="${escapeHtmlAttr(assetToAttr(config.asset))}"`;

  // Scheme: emit the custom accent as data-color when custom, else the named scheme as data-scheme.
  if (config.scheme === "custom" && config.color) {
    attrs += ` data-color="${escapeHtmlAttr(config.color)}"`;
  } else if (config.scheme === "purple") {
    attrs += ` data-scheme="purple"`;
  } else {
    attrs += ` data-scheme="green"`;
  }

  if (config.presets && config.presets.length) {
    attrs += ` data-amount-presets="${escapeHtmlAttr(config.presets.join(","))}"`;
  }
  if (config.label) {
    attrs += ` data-label="${escapeHtmlAttr(config.label)}"`;
  }
  return `<script${attrs} async></script>`;
}

/**
 * buildSnippetFromInput — convenience: validate raw input, and on success return the snippet; on
 * failure return the validation errors. Used by the raw query-param endpoint + the UI.
 */
export function buildSnippetFromInput(
  input: Parameters<typeof validateConfig>[0],
  origin: string = SITE_ORIGIN,
): { ok: true; snippet: string; config: TipConfig } | { ok: false; errors: ValidationErrors } {
  const result = validateConfig(input);
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, snippet: buildEmbedSnippet(result.config, origin), config: result.config };
}

/** Raw query params relevant to the builder, extracted from a URLSearchParams. */
export interface QueryParams {
  recipient: string | null;
  asset: string | null;
  scheme: string | null;
  color: string | null;
  presets: string | null;
  label: string | null;
  raw: boolean;
}

/**
 * parseQueryParams — extract the builder's query-param API from a query string / URLSearchParams.
 * Accepts `?recipient=…&asset=xch|<catId>&scheme=green|purple|<hex>&color=<hex>&presets=1,5&raw=1`.
 * `raw` is true when `raw=1`/`raw=true` OR `format=raw` is present (the machine-readable mode).
 */
export function parseQueryParams(search: string | URLSearchParams): QueryParams {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  const rawFlag = p.get("raw");
  const format = p.get("format");
  const raw =
    rawFlag === "1" ||
    rawFlag === "true" ||
    (format != null && format.toLowerCase() === "raw");
  return {
    recipient: p.get("recipient"),
    asset: p.get("asset"),
    scheme: p.get("scheme"),
    color: p.get("color"),
    presets: p.get("presets"),
    label: p.get("label"),
    raw,
  };
}

/** True when the query params carry ANY builder input (so the page should pre-fill / go raw). */
export function hasBuilderParams(q: QueryParams): boolean {
  return (
    q.recipient != null ||
    q.asset != null ||
    q.scheme != null ||
    q.color != null ||
    q.presets != null ||
    q.label != null
  );
}
