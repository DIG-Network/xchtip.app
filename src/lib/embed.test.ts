import { describe, it, expect } from "vitest";
import {
  isValidCatAssetId,
  parseAsset,
  assetToAttr,
  isDigAsset,
  defaultPresetsFor,
  parsePresets,
  assetSymbol,
  escapeHtmlAttr,
  validateConfig,
  buildEmbedSnippet,
  buildSnippetFromInput,
  parseQueryParams,
  hasBuilderParams,
  type TipConfig,
} from "./embed";
import { DIG_ASSET_ID } from "./constants";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const CAT = "b".repeat(64);

describe("isValidCatAssetId", () => {
  it("accepts a bare 64-hex id (any case, 0x-prefixed)", () => {
    expect(isValidCatAssetId(CAT)).toBe(true);
    expect(isValidCatAssetId(DIG_ASSET_ID)).toBe(true);
    expect(isValidCatAssetId("0x" + CAT)).toBe(true);
    expect(isValidCatAssetId(CAT.toUpperCase())).toBe(true);
  });
  it("rejects wrong length / non-hex / empty", () => {
    expect(isValidCatAssetId("b".repeat(63))).toBe(false);
    expect(isValidCatAssetId("b".repeat(65))).toBe(false);
    expect(isValidCatAssetId("z".repeat(64))).toBe(false);
    expect(isValidCatAssetId("")).toBe(false);
    expect(isValidCatAssetId(null)).toBe(false);
  });
});

describe("parseAsset", () => {
  it("parses xch (any case)", () => {
    expect(parseAsset("xch")).toEqual({ kind: "xch" });
    expect(parseAsset("XCH")).toEqual({ kind: "xch" });
    expect(parseAsset(" Xch ")).toEqual({ kind: "xch" });
  });
  it("parses a CAT id (lowercased, 0x-stripped)", () => {
    expect(parseAsset("0x" + CAT.toUpperCase())).toEqual({ kind: "cat", assetId: CAT });
    expect(parseAsset(DIG_ASSET_ID)).toEqual({ kind: "cat", assetId: DIG_ASSET_ID });
  });
  it("returns null for empty / invalid", () => {
    expect(parseAsset("")).toBeNull();
    expect(parseAsset(null)).toBeNull();
    expect(parseAsset("nope")).toBeNull();
    expect(parseAsset("b".repeat(63))).toBeNull();
  });
});

describe("assetToAttr / isDigAsset / defaultPresetsFor", () => {
  it("emits the right data-asset attr value", () => {
    expect(assetToAttr({ kind: "xch" })).toBe("xch");
    expect(assetToAttr({ kind: "cat", assetId: CAT })).toBe(CAT);
  });
  it("detects the DIG asset", () => {
    expect(isDigAsset({ kind: "cat", assetId: DIG_ASSET_ID })).toBe(true);
    expect(isDigAsset({ kind: "cat", assetId: CAT })).toBe(false);
    expect(isDigAsset({ kind: "xch" })).toBe(false);
  });
  it("shows the display symbol per asset", () => {
    expect(assetSymbol({ kind: "xch" })).toBe("XCH");
    expect(assetSymbol({ kind: "cat", assetId: DIG_ASSET_ID })).toBe("$DIG");
    expect(assetSymbol({ kind: "cat", assetId: CAT })).toBe("CAT");
  });
  it("uses XCH defaults for xch, DIG defaults for CATs", () => {
    expect(defaultPresetsFor({ kind: "xch" })).toEqual([0.1, 0.5, 1]);
    expect(defaultPresetsFor({ kind: "cat", assetId: CAT })).toEqual([1, 5, 25]);
  });
});

describe("parsePresets", () => {
  it("parses a comma list", () => {
    expect(parsePresets("1,5,25")).toEqual([1, 5, 25]);
    expect(parsePresets("0.1, 0.5 , 1")).toEqual([0.1, 0.5, 1]);
  });
  it("drops invalid entries", () => {
    expect(parsePresets("1,x,5,-2,0")).toEqual([1, 5]);
  });
  it("returns null for empty / all-invalid / null", () => {
    expect(parsePresets("")).toBeNull();
    expect(parsePresets("x,y")).toBeNull();
    expect(parsePresets(null)).toBeNull();
  });
});

describe("escapeHtmlAttr", () => {
  it("escapes attribute-breaking chars", () => {
    expect(escapeHtmlAttr('a"b<c>&\'')).toBe("a&quot;b&lt;c&gt;&amp;&#39;");
  });
  it("handles null/undefined", () => {
    expect(escapeHtmlAttr(null)).toBe("");
  });
});

describe("validateConfig", () => {
  it("validates a full XCH config", () => {
    const r = validateConfig({ recipient: XCH, asset: "xch", scheme: "green" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.asset).toEqual({ kind: "xch" });
      expect(r.config.scheme).toBe("green");
      expect(r.config.color).toBeNull();
    }
  });

  it("validates a $DIG preset config (CAT + purple)", () => {
    const r = validateConfig({ recipient: XCH, asset: DIG_ASSET_ID, scheme: "purple" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.asset).toEqual({ kind: "cat", assetId: DIG_ASSET_ID });
      expect(r.config.scheme).toBe("purple");
    }
  });

  it("treats a hex scheme as a custom color", () => {
    const r = validateConfig({ recipient: XCH, asset: "xch", scheme: "#123abc" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.scheme).toBe("custom");
      expect(r.config.color).toBe("#123abc");
    }
  });

  it("treats an explicit color input as custom (overriding scheme)", () => {
    const r = validateConfig({ recipient: XCH, asset: "xch", scheme: "green", color: "#abcabc" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.scheme).toBe("custom");
      expect(r.config.color).toBe("#abcabc");
    }
  });

  it("errors on a bad recipient", () => {
    const r = validateConfig({ recipient: "nope", asset: "xch" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.recipient).toBeDefined();
  });

  it("errors on a bad asset", () => {
    const r = validateConfig({ recipient: XCH, asset: "notanasset" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.asset).toBeDefined();
  });

  it("errors on a bad custom color", () => {
    const r = validateConfig({ recipient: XCH, asset: "xch", color: "notacolor" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.color).toBeDefined();
  });

  it("collects multiple errors at once", () => {
    const r = validateConfig({ recipient: "bad", asset: "bad", color: "bad" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.recipient).toBeDefined();
      expect(r.errors.asset).toBeDefined();
      expect(r.errors.color).toBeDefined();
    }
  });

  it("normalizes an empty label to null and keeps a real one", () => {
    const r1 = validateConfig({ recipient: XCH, asset: "xch", label: "   " });
    expect(r1.ok && r1.config.label).toBe(null);
    const r2 = validateConfig({ recipient: XCH, asset: "xch", label: "Buy me a coffee" });
    expect(r2.ok && r2.config.label).toBe("Buy me a coffee");
  });

  it("falls back to green for a non-hex non-named scheme", () => {
    const r = validateConfig({ recipient: XCH, asset: "xch", scheme: "rainbow" });
    expect(r.ok && r.config.scheme).toBe("green");
  });
});

describe("buildEmbedSnippet", () => {
  const base: TipConfig = {
    recipient: XCH,
    asset: { kind: "xch" },
    scheme: "green",
    color: null,
    presets: null,
    label: null,
    variant: "button",
    symbol: null,
  };

  it("emits a self-contained script tag with the recipient + asset + scheme", () => {
    const s = buildEmbedSnippet(base);
    expect(s).toContain('src="https://xchtip.app/embed/xch-tip.js"');
    expect(s).toContain(`data-recipient="${XCH}"`);
    expect(s).toContain('data-asset="xch"');
    expect(s).toContain('data-scheme="green"');
    expect(s).toContain("async>");
    expect(s.startsWith("<script")).toBe(true);
    expect(s.endsWith("></script>")).toBe(true);
  });

  it("emits data-color for a custom scheme (not data-scheme)", () => {
    const s = buildEmbedSnippet({ ...base, scheme: "custom", color: "#7a3dff" });
    expect(s).toContain('data-color="#7a3dff"');
    expect(s).not.toContain("data-scheme=");
  });

  it("emits the DIG asset id + purple for a $DIG snippet", () => {
    const s = buildEmbedSnippet({ ...base, asset: { kind: "cat", assetId: DIG_ASSET_ID }, scheme: "purple" });
    expect(s).toContain(`data-asset="${DIG_ASSET_ID}"`);
    expect(s).toContain('data-scheme="purple"');
  });

  it("includes presets + label when present", () => {
    const s = buildEmbedSnippet({ ...base, presets: [1, 5, 25], label: 'Tip "me"' });
    expect(s).toContain('data-amount-presets="1,5,25"');
    expect(s).toContain("data-label=\"Tip &quot;me&quot;\"");
  });

  it("respects a custom origin", () => {
    const s = buildEmbedSnippet(base, "https://example.test/");
    expect(s).toContain('src="https://example.test/embed/xch-tip.js"');
  });

  it("emits data-variant only when it is not the default button", () => {
    expect(buildEmbedSnippet(base)).not.toContain("data-variant");
    for (const v of ["compact", "pill", "inline", "banner", "card"] as const) {
      expect(buildEmbedSnippet({ ...base, variant: v })).toContain(`data-variant="${v}"`);
    }
  });

  it("emits data-symbol when a CAT symbol is set", () => {
    expect(buildEmbedSnippet(base)).not.toContain("data-symbol");
    const s = buildEmbedSnippet({ ...base, asset: { kind: "cat", assetId: DIG_ASSET_ID }, symbol: "DIG" });
    expect(s).toContain('data-symbol="DIG"');
  });
});

describe("buildSnippetFromInput", () => {
  it("returns a snippet on valid input", () => {
    const r = buildSnippetFromInput({ recipient: XCH, asset: "xch", scheme: "green" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.snippet).toContain("xch-tip.js");
  });
  it("returns errors on invalid input", () => {
    const r = buildSnippetFromInput({ recipient: "bad", asset: "xch" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.recipient).toBeDefined();
  });
});

describe("parseQueryParams", () => {
  it("extracts every builder param", () => {
    const q = parseQueryParams(
      `?recipient=${XCH}&asset=${DIG_ASSET_ID}&scheme=purple&color=%237a3dff&presets=1,5&label=Tip&raw=1`,
    );
    expect(q.recipient).toBe(XCH);
    expect(q.asset).toBe(DIG_ASSET_ID);
    expect(q.scheme).toBe("purple");
    expect(q.color).toBe("#7a3dff");
    expect(q.presets).toBe("1,5");
    expect(q.label).toBe("Tip");
    expect(q.raw).toBe(true);
  });

  it("treats raw=true / format=raw as raw mode; nothing otherwise", () => {
    expect(parseQueryParams("?raw=true").raw).toBe(true);
    expect(parseQueryParams("?format=raw").raw).toBe(true);
    expect(parseQueryParams("?format=RAW").raw).toBe(true);
    expect(parseQueryParams("?raw=0").raw).toBe(false);
    expect(parseQueryParams("").raw).toBe(false);
  });

  it("accepts a URLSearchParams directly", () => {
    const q = parseQueryParams(new URLSearchParams({ asset: "xch" }));
    expect(q.asset).toBe("xch");
  });
});

describe("hasBuilderParams", () => {
  it("is true when any builder field is present", () => {
    expect(hasBuilderParams(parseQueryParams("?asset=xch"))).toBe(true);
    expect(hasBuilderParams(parseQueryParams(`?recipient=${XCH}`))).toBe(true);
  });
  it("is false when only raw / unrelated params are present", () => {
    expect(hasBuilderParams(parseQueryParams("?raw=1"))).toBe(false);
    expect(hasBuilderParams(parseQueryParams(""))).toBe(false);
  });
});

// End-to-end mapping: query params → snippet (the raw-mode machine path).
describe("query-param → snippet mapping (raw mode)", () => {
  it("maps a full $DIG link to the exact DIG snippet", () => {
    const q = parseQueryParams(`?recipient=${XCH}&asset=${DIG_ASSET_ID}&scheme=purple&presets=1,5,25`);
    const r = buildSnippetFromInput({
      recipient: q.recipient,
      asset: q.asset,
      scheme: q.scheme,
      color: q.color,
      presets: q.presets,
      label: q.label,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.snippet).toContain(`data-asset="${DIG_ASSET_ID}"`);
      expect(r.snippet).toContain('data-scheme="purple"');
      expect(r.snippet).toContain('data-amount-presets="1,5,25"');
    }
  });

  it("maps a custom-color XCH link", () => {
    const q = parseQueryParams(`?recipient=${XCH}&asset=xch&color=%2300aabb`);
    const r = buildSnippetFromInput({
      recipient: q.recipient,
      asset: q.asset,
      scheme: q.scheme,
      color: q.color,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.snippet).toContain('data-color="#00aabb"');
  });
});
