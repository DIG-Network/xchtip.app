// assetGlyph.ts — PURE logo/mark resolution for an asset (no DOM, no React). The single source of
// truth for the "custom logo URL > preset built-in mark > text fallback" precedence (SPEC.md
// §"Custom logo"). Consumed by the React AssetGlyph component (components/AssetGlyph.tsx) AND
// intended for reuse by any future non-React renderer that must show the SAME mark a visitor sees
// on the page — e.g. a server-side per-jar OG/Twitter-card image generator, which needs to resolve
// the identical mark from the identical (asset, symbol, logo) inputs without importing React.

import { isDigAsset, isHoaAsset, type Asset } from "./embed";

/** Which mark to render for an asset, in resolved precedence order. */
export type AssetGlyphKind =
  | { kind: "custom-image"; url: string }
  | { kind: "chia-leaf" }
  | { kind: "dig-mark" }
  | { kind: "hoa-orange" }
  | { kind: "fallback-text"; char: string };

/**
 * resolveAssetGlyph — the mark to show for `asset`, given an optional custom `logo` URL and the
 * display `symbol` (used for the text-fallback initial). Precedence: an explicit custom logo URL
 * always wins; otherwise the built-in DIG/HOA/XCH mark; otherwise a single-character fallback.
 *
 * A renderer that shows the custom image (`kind: "custom-image"`) is expected to fall back to the
 * non-custom resolution — `resolveAssetGlyph(asset, symbol)` with no `logo` — if the image fails to
 * load/fetch, so a broken URL never leaves a broken image (see components/SafeLogoImage.tsx for the
 * React runtime fallback; a server-side renderer applies the same rule at generation time).
 */
export function resolveAssetGlyph(asset: Asset, symbol: string, logo?: string | null): AssetGlyphKind {
  if (logo) return { kind: "custom-image", url: logo };
  if (asset.kind === "xch") return { kind: "chia-leaf" };
  if (isDigAsset(asset)) return { kind: "dig-mark" };
  if (isHoaAsset(asset)) return { kind: "hoa-orange" };
  return { kind: "fallback-text", char: (symbol || "?").trim().slice(0, 1).toUpperCase() || "?" };
}
