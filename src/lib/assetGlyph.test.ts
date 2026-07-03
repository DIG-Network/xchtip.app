// assetGlyph.ts — pure logo/mark resolution (no DOM, no React), reused by the AssetGlyph component
// AND intended for reuse by any future non-React renderer that must show the SAME mark a visitor
// sees on the page (e.g. a per-jar OG/Twitter-card image generator).

import { describe, it, expect } from "vitest";
import { resolveAssetGlyph } from "./assetGlyph";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "./constants";

describe("resolveAssetGlyph", () => {
  it("resolves the Chia leaf for XCH", () => {
    expect(resolveAssetGlyph({ kind: "xch" }, "XCH")).toEqual({ kind: "chia-leaf" });
  });

  it("resolves the DIG mark for the canonical $DIG CAT", () => {
    expect(resolveAssetGlyph({ kind: "cat", assetId: DIG_ASSET_ID }, "$DIG")).toEqual({ kind: "dig-mark" });
  });

  it("resolves the HOA orange mark for the canonical HOA CAT", () => {
    expect(resolveAssetGlyph({ kind: "cat", assetId: HOA_ASSET_ID }, "HOA")).toEqual({ kind: "hoa-orange" });
  });

  it("resolves a text-fallback initial for an unknown CAT with no logo", () => {
    expect(resolveAssetGlyph({ kind: "cat", assetId: "c".repeat(64) }, "SBX")).toEqual({
      kind: "fallback-text",
      char: "S",
    });
  });

  it("falls back to '?' when there is no symbol at all", () => {
    expect(resolveAssetGlyph({ kind: "cat", assetId: "c".repeat(64) }, "")).toEqual({
      kind: "fallback-text",
      char: "?",
    });
  });

  it("a custom logo URL takes precedence over every built-in mark", () => {
    expect(resolveAssetGlyph({ kind: "xch" }, "XCH", "https://example.com/logo.png")).toEqual({
      kind: "custom-image",
      url: "https://example.com/logo.png",
    });
    expect(resolveAssetGlyph({ kind: "cat", assetId: DIG_ASSET_ID }, "$DIG", "https://example.com/a.png")).toEqual({
      kind: "custom-image",
      url: "https://example.com/a.png",
    });
  });

  it("ignores a null/undefined/empty logo (falls through to the built-in resolution)", () => {
    expect(resolveAssetGlyph({ kind: "xch" }, "XCH", null)).toEqual({ kind: "chia-leaf" });
    expect(resolveAssetGlyph({ kind: "xch" }, "XCH", undefined)).toEqual({ kind: "chia-leaf" });
    expect(resolveAssetGlyph({ kind: "xch" }, "XCH", "")).toEqual({ kind: "chia-leaf" });
  });
});
