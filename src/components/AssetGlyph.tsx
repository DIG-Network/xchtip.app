// AssetGlyph — the coin logo/mark shown wherever an asset is named (the jar page next to "Paid
// in <asset>", the builder's quick-preset buttons). Mirrors EXACTLY the widget's own brand glyphs
// (public/embed/xch-tip.js: glyphChiaLeaf/glyphDig/the HOA 🍊 emoji) so the same visual mark
// appears everywhere the asset appears — one visual identity, two runtimes (this React component
// for xchtip's own surfaces; the vanilla-JS glyph functions for the embeddable widget, which stays
// a dependency-free standalone script — see SPEC.md §5). If either changes, update both together.
//
// Precedence (SPEC.md §5 data-logo / §"Custom logo"): an explicit custom `logo` URL > the built-in
// preset mark (DIG/HOA/XCH) > a graceful text-symbol/initial fallback for an unknown CAT with no
// logo — never a broken image.

import type { Asset } from "@/lib/embed";
import { resolveAssetGlyph } from "@/lib/assetGlyph";
import { SafeLogoImage } from "./SafeLogoImage";

export interface AssetGlyphProps {
  asset: Asset;
  /** The display symbol (used as the fallback initial + the image `alt` text). */
  symbol: string;
  /** An explicit custom logo URL (highest precedence) — already validated by lib/logo.ts. */
  logo?: string | null;
  className?: string;
  size?: number;
}

export function AssetGlyph({ asset, symbol, logo, className, size }: AssetGlyphProps) {
  const resolved = resolveAssetGlyph(asset, symbol, logo);
  const builtIn = <BuiltInMark asset={asset} symbol={symbol} className={className} />;
  if (resolved.kind === "custom-image") {
    return (
      <SafeLogoImage src={resolved.url} alt={symbol || "logo"} className={className} size={size} fallback={builtIn} />
    );
  }
  return builtIn;
}

// Renders the built-in (non-custom) mark — reuses the SAME pure resolution (with no `logo`), so
// there is exactly one decision point for "which built-in mark" (lib/assetGlyph.ts).
function BuiltInMark({ asset, symbol, className }: { asset: Asset; symbol: string; className?: string }) {
  const kind = resolveAssetGlyph(asset, symbol);
  switch (kind.kind) {
    case "chia-leaf":
      return <ChiaLeafGlyph className={className} />;
    case "dig-mark":
      return <DigGlyph className={className} />;
    case "hoa-orange":
      return (
        <span className={className} data-testid="asset-glyph-hoa" aria-hidden="true">
          🍊
        </span>
      );
    case "fallback-text":
    default:
      // Unknown CAT, no logo → a graceful text-symbol/initial fallback (never a broken image).
      return (
        <span className={className} data-testid="asset-glyph-fallback" aria-hidden="true">
          {kind.kind === "fallback-text" ? kind.char : "?"}
        </span>
      );
  }
}

// The Chia leaf mark — SAME path data as xch-tip.js's glyphChiaLeaf().
function ChiaLeafGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      data-testid="asset-glyph-xch"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M12 2C7 6 4 10 4 14.5A7.5 7.5 0 0 0 11.5 22c.3 0 .5-.2.5-.5V12c0-.3.2-.5.5-.5s.5.2.5.5v9.5c0 .3.2.5.5.5A7.5 7.5 0 0 0 20 14.5C20 10 17 6 12 2z" />
    </svg>
  );
}

// The DIG "D" mark — SAME path data as xch-tip.js's glyphDig().
function DigGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      data-testid="asset-glyph-dig"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M5 4h6a8 8 0 0 1 0 16H5V4zm3.2 3.1v9.8H11a4.9 4.9 0 0 0 0-9.8H8.2z" />
    </svg>
  );
}
