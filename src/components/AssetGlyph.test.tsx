// AssetGlyph — the coin logo/mark shown wherever an asset is named (the jar page, the builder's
// quick-preset buttons). Precedence: an explicit custom `logo` URL > the built-in preset mark
// (DIG/HOA/XCH) > a graceful text-symbol fallback for an unknown CAT with no logo.

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssetGlyph } from "./AssetGlyph";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "@/lib/constants";

describe("AssetGlyph", () => {
  it("renders the Chia leaf mark for XCH", () => {
    render(<AssetGlyph asset={{ kind: "xch" }} symbol="XCH" />);
    expect(screen.getByTestId("asset-glyph-xch")).toBeInTheDocument();
  });

  it("renders the DIG mark for the canonical $DIG CAT", () => {
    render(<AssetGlyph asset={{ kind: "cat", assetId: DIG_ASSET_ID }} symbol="$DIG" />);
    expect(screen.getByTestId("asset-glyph-dig")).toBeInTheDocument();
  });

  it("renders the 🍊 mark for the canonical HOA CAT", () => {
    render(<AssetGlyph asset={{ kind: "cat", assetId: HOA_ASSET_ID }} symbol="HOA" />);
    const el = screen.getByTestId("asset-glyph-hoa");
    expect(el).toHaveTextContent("🍊");
  });

  it("falls back to a text initial for an unknown CAT with no logo (never a broken image)", () => {
    render(<AssetGlyph asset={{ kind: "cat", assetId: "c".repeat(64) }} symbol="SBX" />);
    const el = screen.getByTestId("asset-glyph-fallback");
    expect(el).toHaveTextContent("S");
  });

  it("falls back to '?' when there is no symbol at all", () => {
    render(<AssetGlyph asset={{ kind: "cat", assetId: "c".repeat(64) }} symbol="" />);
    expect(screen.getByTestId("asset-glyph-fallback")).toHaveTextContent("?");
  });

  it("a custom logo URL takes precedence over the built-in DIG mark", () => {
    render(<AssetGlyph asset={{ kind: "cat", assetId: DIG_ASSET_ID }} symbol="$DIG" logo="https://example.com/logo.png" />);
    expect(screen.getByRole("img", { name: "$DIG" })).toHaveAttribute("src", "https://example.com/logo.png");
    expect(screen.queryByTestId("asset-glyph-dig")).not.toBeInTheDocument();
  });

  it("a custom logo URL takes precedence for XCH too", () => {
    render(<AssetGlyph asset={{ kind: "xch" }} symbol="XCH" logo="https://example.com/logo.png" />);
    expect(screen.getByRole("img", { name: "XCH" })).toBeInTheDocument();
    expect(screen.queryByTestId("asset-glyph-xch")).not.toBeInTheDocument();
  });

  it("falls back to the built-in mark if the custom logo fails to load", () => {
    render(<AssetGlyph asset={{ kind: "xch" }} symbol="XCH" logo="https://example.com/broken.png" />);
    const img = screen.getByRole("img", { name: "XCH" });
    fireEvent.error(img);
    expect(screen.getByTestId("asset-glyph-xch")).toBeInTheDocument();
  });
});
