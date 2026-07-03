// ogCard.ts — pure param→model mapping + satori element-tree composition for the per-recipient
// OG/Twitter-card image (#221: `GET /og?recipient=&name=&asset=&scheme=&logo=` → a 1200×630 PNG).
//
// This is the SINGLE SOURCE the `/og` Lambda renders from, and it deliberately reuses the SAME
// resolution modules the jar page (features/jar/JarPage.tsx) paints with — resolveScheme/
// deriveSurfaces (schemes.ts) for the color, resolveAssetGlyph (assetGlyph.ts) for the coin mark —
// so the card a crawler unfurls is never able to drift from what a human visitor actually sees.
//
// Split deliberately from the AWS glue (lambda/og-image/src/handler.ts): everything here is a pure
// function (no satori/resvg import, no AWS SDK, no network EXCEPT the injectable fetch in
// `resolveOgLogo`) so the param→props mapping, sanitization, and custom-logo fail-soft behavior are
// unit-tested with plain vitest — the lambda only adds satori()/Resvg() + the HTTP envelope around
// `buildOgCardModel` + `buildOgTree`.

import { parseAsset, assetSymbol as autoAssetSymbol, normalizeDisplayName, type Asset } from "./embed";
import { resolveScheme, normalizeHexColor, type ResolvedScheme } from "./schemes";
import { resolveAssetGlyph, type AssetGlyphKind } from "./assetGlyph";
import { normalizeLogoUrl } from "./logo";
import { shortenMiddle } from "./format";
import { CHIA_LEAF_PATH, DIG_MARK_PATH } from "./brandMarks";

/** The OG/Twitter card's fixed pixel dimensions (the standard `summary_large_image` size). */
export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;

/** The raw `/og` query params (all optional; every field fails soft to a sane default). */
export interface OgCardQuery {
  recipient?: string | null;
  name?: string | null;
  asset?: string | null;
  scheme?: string | null;
  color?: string | null;
  symbol?: string | null;
  logo?: string | null;
}

/** The resolved, render-ready model `buildOgTree` draws from. */
export interface OgCardModel {
  /** The card headline: the sanitized display name, or a generic fallback when none is given. */
  heading: string;
  /** A shortened recipient address (`xch1qyqs…s0wg4qq`), or "" when no recipient was given. */
  addressShort: string;
  /** "Tip me in <symbol>". */
  pitch: string;
  /** The resolved display symbol (XCH / $DIG / HOA / CAT / an override). */
  symbol: string;
  /** The resolved color scheme — the SAME palette the jar page themes its surfaces with. */
  scheme: ResolvedScheme;
  /** Which mark to draw, in the SAME precedence as everywhere else (custom-image is NOT yet embedded — see resolveOgLogo). */
  glyph: AssetGlyphKind;
}

/** The generic headline shown when no display name is given (mirrors jarHeadingGeneric). */
export const OG_CARD_GENERIC_HEADING = "Send a tip";

/**
 * buildOgCardModel — map raw `/og` query params into a render-ready model. NEVER throws and never
 * requires a valid recipient/asset: an invalid/missing input just falls back to the safe default
 * (green scheme, XCH pitch, chia-leaf mark) so the endpoint always has SOMETHING coherent to draw —
 * a broken link-preview image would be worse than a generic one.
 */
export function buildOgCardModel(query: OgCardQuery): OgCardModel {
  const asset: Asset = parseAsset(query.asset) ?? { kind: "xch" };
  const symbolOverride = String(query.symbol ?? "").trim();
  const symbol = symbolOverride || autoAssetSymbol(asset);

  const name = normalizeDisplayName(query.name);
  const recipient = String(query.recipient ?? "").trim();
  const addressShort = recipient ? shortenMiddle(recipient) : "";
  const heading = name ?? OG_CARD_GENERIC_HEADING;
  const pitch = `Tip me in ${symbol}`;

  // A custom color always wins over a named scheme (the SAME precedence as schemeAttr/jarPath
  // elsewhere) — resolveScheme itself accepts either a named scheme OR a hex color as one selector.
  const colorHex = normalizeHexColor(query.color);
  const scheme = resolveScheme(colorHex ?? query.scheme ?? null);

  const logo = normalizeLogoUrl(query.logo);
  const glyph = resolveAssetGlyph(asset, symbol, logo);

  return { heading, addressShort, pitch, symbol, scheme, glyph };
}

// ── Server-side custom-logo embedding (fetch + fail-soft) ─────────────────────────────────────────

/** Options for `resolveOgLogo`'s server-side logo fetch. */
export interface ResolveOgLogoOptions {
  /** Reject a response body larger than this (bytes). Default 300kB. */
  maxBytes?: number;
  /** Abort the fetch after this many ms. Default 4000. */
  timeoutMs?: number;
  /** Injectable fetch implementation (tests supply a mock; defaults to the global `fetch`). */
  fetchImpl?: typeof fetch;
}

const DEFAULT_MAX_LOGO_BYTES = 300_000;
const DEFAULT_LOGO_TIMEOUT_MS = 4000;

/**
 * resolveOgLogo — turn a glyph resolution into something satori can actually draw:
 *   • a non-`custom-image` glyph passes through unchanged (buildOgTree draws the built-in mark).
 *   • a `data:` custom logo is already inline — used as-is, no fetch needed.
 *   • an `https://` custom logo is fetched SERVER-SIDE (satori/resvg have no browser `<img>`
 *     loader) and re-embedded as a `data:` URI, size-capped and timeout-bounded.
 *
 * ANY failure — network error, timeout, non-2xx, a non-image content-type, or an oversized body —
 * falls back to the asset's BUILT-IN mark (never a broken image, never a hard error), mirroring
 * the client-side contract documented on `resolveAssetGlyph` / `SafeLogoImage`.
 */
export async function resolveOgLogo(
  glyph: AssetGlyphKind,
  asset: Asset,
  symbol: string,
  options: ResolveOgLogoOptions = {},
): Promise<AssetGlyphKind> {
  if (glyph.kind !== "custom-image") return glyph;
  if (/^data:/i.test(glyph.url)) return glyph; // already inline — satori draws it directly

  const embedded = await fetchAsDataUri(glyph.url, options);
  return embedded ? { kind: "custom-image", url: embedded } : resolveAssetGlyph(asset, symbol);
}

async function fetchAsDataUri(url: string, options: ResolveOgLogoOptions): Promise<string | null> {
  const fetchFn = options.fetchImpl ?? (typeof fetch === "function" ? fetch : undefined);
  if (!fetchFn) return null;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_LOGO_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_LOGO_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, { signal: controller.signal });
    if (!res || !res.ok) return null;
    const contentType = res.headers?.get?.("content-type") || "";
    if (!/^image\//i.test(contentType)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > maxBytes) return null;
    const base64 = base64FromBytes(buf);
    return `data:${contentType.split(";")[0].trim()};base64,${base64}`;
  } catch {
    return null; // network error, abort/timeout, malformed response — fail soft
  } finally {
    clearTimeout(timer);
  }
}

// base64FromBytes — plain btoa/binary-string encoding (no Node `Buffer` global — the main app's
// tsconfig deliberately omits @types/node from its global "types", and this module is compiled by
// BOTH that config and the Lambda's, so it stays portable to both without a Buffer type dependency).
function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// ── satori element-tree composition (pure; no satori import needed to test the SHAPE) ────────────

/** A minimal satori-compatible element node (a plain object — no JSX/React needed). */
export interface SatoriNode {
  type: string;
  props: Record<string, unknown> & { style?: Record<string, string | number>; children?: unknown };
}

function el(
  type: string,
  style: Record<string, string | number> = {},
  children?: unknown,
  extraProps: Record<string, unknown> = {},
): SatoriNode {
  return { type, props: { style, children, ...extraProps } };
}

// buildMarkNode — the coin mark: a pixel-identical vector reuse of the Chia leaf / DIG "D" mark
// (brandMarks.ts, the SAME path data <AssetGlyph> draws in the browser) for those two; a colored
// monogram disc for the HOA 🍊 emoji mark and the generic text-fallback (satori has no bundled
// color-emoji font, so a letter monogram renders reliably instead of a broken/mono glyph — a
// documented simplification, not a resolution-precedence change: which mark wins is still decided
// by the ONE shared `resolveAssetGlyph`).
function buildMarkNode(glyph: AssetGlyphKind, scheme: ResolvedScheme): SatoriNode {
  const discBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "110px",
    height: "110px",
    borderRadius: "999px",
    flexShrink: 0,
    color: "#ffffff",
    fontSize: "48px",
    fontWeight: 700,
  };

  switch (glyph.kind) {
    case "custom-image":
      return el(
        "img",
        { width: "110px", height: "110px", borderRadius: "24px", objectFit: "contain", flexShrink: 0 },
        undefined,
        { src: glyph.url, width: 110, height: 110 },
      );
    case "chia-leaf":
      return el("div", { ...discBase, background: "#3ab54a" }, svgIcon(CHIA_LEAF_PATH));
    case "dig-mark":
      return el(
        "div",
        { ...discBase, background: `linear-gradient(135deg, ${PURPLE_FROM} 0%, ${PURPLE_TO} 100%)` },
        svgIcon(DIG_MARK_PATH),
      );
    case "hoa-orange":
      return el(
        "div",
        { ...discBase, background: `linear-gradient(135deg, ${ORANGE_FROM} 0%, ${ORANGE_TO} 100%)` },
        "H",
      );
    case "fallback-text":
    default:
      return el(
        "div",
        { ...discBase, background: `linear-gradient(135deg, ${scheme.gradientFrom} 0%, ${scheme.gradientTo} 100%)` },
        glyph.kind === "fallback-text" ? glyph.char : "?",
      );
  }
}

// The DIG/HOA brand gradients, mirrored from schemes.ts's PURPLE_SCHEME/ORANGE_SCHEME (kept as
// literals here to avoid a runtime import cycle risk; values are asserted equal in ogCard.test.ts).
const PURPLE_FROM = "#7a3dff";
const PURPLE_TO = "#ff00de";
const ORANGE_FROM = "#ff8c1a";
const ORANGE_TO = "#e05a00";

function svgIcon(d: string): SatoriNode {
  return el(
    "svg",
    { display: "block" },
    el("path", {}, undefined, { d, fill: "#ffffff" }),
    { viewBox: "0 0 24 24", width: "56", height: "56" },
  );
}

/**
 * buildOgTree — the full 1200×630 satori element tree for `model`. `resolvedGlyph` is the OUTPUT of
 * `resolveOgLogo` (a custom logo already embedded as a `data:` URI, or the built-in-mark fallback) —
 * kept as a separate parameter (rather than reading `model.glyph`) so this stays a SYNCHRONOUS, pure
 * function even though resolving a remote logo is async.
 */
export function buildOgTree(model: OgCardModel, resolvedGlyph: AssetGlyphKind = model.glyph): SatoriNode {
  const s = model.scheme.surfaces;

  return el("div", {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    width: `${OG_CARD_WIDTH}px`,
    height: `${OG_CARD_HEIGHT}px`,
    padding: "76px 84px",
    backgroundColor: s.bg,
    color: "#eef4f0",
    fontFamily: "Inter",
  }, [
    // top accent bar — the scheme's own gradient, matching the jar page's top-edge accent.
    el("div", {
      position: "absolute",
      top: "0px",
      left: "0px",
      width: `${OG_CARD_WIDTH}px`,
      height: "10px",
      background: `linear-gradient(90deg, ${model.scheme.gradientFrom} 0%, ${model.scheme.gradientTo} 100%)`,
    }),
    // brand row
    el("div", { display: "flex", alignItems: "center", gap: "14px", marginBottom: "40px" }, [
      el("span", { color: model.scheme.gradientFrom, fontSize: "32px" }, "♥"),
      el("span", { fontWeight: 700, fontSize: "26px", color: s.textMuted }, "xchtip.app"),
    ]),
    // mark + identity row
    el("div", { display: "flex", alignItems: "center", gap: "36px" }, [
      buildMarkNode(resolvedGlyph, model.scheme),
      el("div", { display: "flex", flexDirection: "column", gap: "12px" }, [
        el("div", { fontSize: "62px", fontWeight: 700, lineHeight: "1.05" }, model.heading),
        ...(model.addressShort
          ? [el("div", { fontSize: "24px", color: s.textMuted, fontFamily: "monospace" }, model.addressShort)]
          : []),
      ]),
    ]),
    // pitch pill
    el("div", { display: "flex", marginTop: "44px" }, [
      el(
        "div",
        {
          padding: "16px 32px",
          borderRadius: "999px",
          background: `linear-gradient(135deg, ${model.scheme.gradientFrom} 0%, ${model.scheme.gradientTo} 100%)`,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "30px",
        },
        model.pitch,
      ),
    ]),
  ]);
}
