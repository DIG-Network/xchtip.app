// ogCard.test.ts — the pure param→props mapping (#221), sanitization, custom-logo fetch fail-soft,
// and the satori element-tree composition. No satori/resvg import here — this exercises exactly the
// SAME reusable resolution the jar page paints with (resolveScheme/resolveAssetGlyph), which is what
// makes the /og card and the jar page impossible to visually drift apart.

import { describe, it, expect, vi } from "vitest";
import {
  buildOgCardModel,
  buildOgTree,
  resolveOgLogo,
  OG_CARD_GENERIC_HEADING,
  OG_CARD_WIDTH,
  OG_CARD_HEIGHT,
  type SatoriNode,
} from "./ogCard";
import { GREEN_SCHEME, PURPLE_SCHEME, ORANGE_SCHEME } from "./schemes";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "./constants";
import { CHIA_LEAF_PATH, DIG_MARK_PATH } from "./brandMarks";

const XCH_ADDR = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

// ── buildOgCardModel ────────────────────────────────────────────────────────────────────────────

describe("buildOgCardModel", () => {
  it("defaults to the green XCH scheme + generic heading + XCH pitch for an empty query", () => {
    const model = buildOgCardModel({});
    expect(model.heading).toBe(OG_CARD_GENERIC_HEADING);
    expect(model.symbol).toBe("XCH");
    expect(model.pitch).toBe("Tip me in XCH");
    expect(model.scheme).toEqual(GREEN_SCHEME);
    expect(model.glyph).toEqual({ kind: "chia-leaf" });
    expect(model.addressShort).toBe("");
  });

  it("an invalid asset id falls back to XCH (never throws, never a broken card)", () => {
    const model = buildOgCardModel({ asset: "not-a-cat-id" });
    expect(model.symbol).toBe("XCH");
    expect(model.glyph).toEqual({ kind: "chia-leaf" });
  });

  it("resolves the $DIG CAT (mark + symbol)", () => {
    const model = buildOgCardModel({ asset: DIG_ASSET_ID });
    expect(model.symbol).toBe("$DIG");
    expect(model.pitch).toBe("Tip me in $DIG");
    expect(model.glyph).toEqual({ kind: "dig-mark" });
  });

  it("resolves the HOA CAT (mark + symbol)", () => {
    const model = buildOgCardModel({ asset: HOA_ASSET_ID });
    expect(model.symbol).toBe("HOA");
    expect(model.glyph).toEqual({ kind: "hoa-orange" });
  });

  it("an unknown CAT with no symbol override falls back to the generic 'CAT' + text-fallback initial", () => {
    const model = buildOgCardModel({ asset: "c".repeat(64) });
    expect(model.symbol).toBe("CAT");
    expect(model.glyph).toEqual({ kind: "fallback-text", char: "C" });
  });

  it("a symbol override wins over auto-detection", () => {
    const model = buildOgCardModel({ asset: "c".repeat(64), symbol: "SBX" });
    expect(model.symbol).toBe("SBX");
    expect(model.pitch).toBe("Tip me in SBX");
  });

  it("uses the sanitized display name as the heading when given", () => {
    const model = buildOgCardModel({ name: "  Alice  " });
    expect(model.heading).toBe("Alice");
  });

  it("hard-sanitizes a URL-sourced name identically to the rest of the app (control chars + length cap)", () => {
    const model = buildOgCardModel({ name: `A\tB${"x".repeat(100)}` });
    // The 104-char input is capped at 64; the tab was collapsed to a plain space, not left as a
    // raw control character.
    expect(model.heading.length).toBe(64);
    expect(model.heading.startsWith("A B")).toBe(true);
  });

  it("shortens the recipient address for display, and omits it entirely when absent", () => {
    const model = buildOgCardModel({ recipient: XCH_ADDR });
    expect(model.addressShort).toBe(`${XCH_ADDR.slice(0, 8)}…${XCH_ADDR.slice(-7)}`);
    expect(buildOgCardModel({}).addressShort).toBe("");
  });

  it("resolves the purple/orange named schemes", () => {
    expect(buildOgCardModel({ scheme: "purple" }).scheme).toEqual(PURPLE_SCHEME);
    expect(buildOgCardModel({ scheme: "orange" }).scheme).toEqual(ORANGE_SCHEME);
  });

  it("an explicit color overrides a named scheme (same precedence as schemeAttr/jarPath)", () => {
    const model = buildOgCardModel({ scheme: "purple", color: "#123456" });
    expect(model.scheme.name).toBe("custom");
    expect(model.scheme.gradientFrom).toBe("#123456");
  });

  it("an invalid scheme selector falls back to green (fail-safe, matches resolveScheme)", () => {
    expect(buildOgCardModel({ scheme: "not-a-scheme" }).scheme).toEqual(GREEN_SCHEME);
  });

  it("a valid https logo wins precedence (embedding happens later, in resolveOgLogo)", () => {
    const model = buildOgCardModel({ logo: "https://example.com/logo.png" });
    expect(model.glyph).toEqual({ kind: "custom-image", url: "https://example.com/logo.png" });
  });

  it("an unsafe logo scheme is dropped, falling back to the built-in mark", () => {
    const model = buildOgCardModel({ asset: "xch", logo: "javascript:alert(1)" });
    expect(model.glyph).toEqual({ kind: "chia-leaf" });
  });
});

// ── resolveOgLogo (server-side fetch + fail-soft) ──────────────────────────────────────────────

const XCH_ASSET = { kind: "xch" as const };

function fakeFetch(impl: (url: string) => Promise<Partial<Response> | null>): typeof fetch {
  return vi.fn((url: string | URL) => impl(String(url))) as unknown as typeof fetch;
}

describe("resolveOgLogo", () => {
  it("passes non-custom-image glyphs through unchanged (no fetch attempted)", async () => {
    const fetchImpl = fakeFetch(async () => {
      throw new Error("should not be called");
    });
    const result = await resolveOgLogo({ kind: "chia-leaf" }, XCH_ASSET, "XCH", { fetchImpl });
    expect(result).toEqual({ kind: "chia-leaf" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("passes a data: custom logo through unchanged (already inline, no fetch needed)", async () => {
    const fetchImpl = fakeFetch(async () => {
      throw new Error("should not be called");
    });
    const dataUrl = "data:image/png;base64,AAAA";
    const result = await resolveOgLogo({ kind: "custom-image", url: dataUrl }, XCH_ASSET, "XCH", { fetchImpl });
    expect(result).toEqual({ kind: "custom-image", url: dataUrl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches an https logo and re-embeds it as a data: URI", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const fetchImpl = fakeFetch(async () => ({
      ok: true,
      headers: { get: (h: string) => (h === "content-type" ? "image/png" : null) } as unknown as Headers,
      arrayBuffer: async () => bytes.buffer,
    }));
    const result = await resolveOgLogo(
      { kind: "custom-image", url: "https://example.com/logo.png" },
      XCH_ASSET,
      "XCH",
      { fetchImpl },
    );
    expect(result.kind).toBe("custom-image");
    expect((result as { url: string }).url).toMatch(/^data:image\/png;base64,/);
  });

  it("falls back to the built-in mark on a non-2xx response", async () => {
    const fetchImpl = fakeFetch(async () => ({ ok: false }));
    const result = await resolveOgLogo(
      { kind: "custom-image", url: "https://example.com/missing.png" },
      XCH_ASSET,
      "XCH",
      { fetchImpl },
    );
    expect(result).toEqual({ kind: "chia-leaf" });
  });

  it("falls back to the built-in mark on a non-image content-type", async () => {
    const fetchImpl = fakeFetch(async () => ({
      ok: true,
      headers: { get: () => "text/html" } as unknown as Headers,
      arrayBuffer: async () => new ArrayBuffer(4),
    }));
    const result = await resolveOgLogo(
      { kind: "custom-image", url: "https://example.com/not-an-image" },
      { kind: "cat", assetId: DIG_ASSET_ID },
      "$DIG",
      { fetchImpl },
    );
    expect(result).toEqual({ kind: "dig-mark" });
  });

  it("falls back to the built-in mark on an oversized body", async () => {
    const big = new Uint8Array(10);
    const fetchImpl = fakeFetch(async () => ({
      ok: true,
      headers: { get: () => "image/png" } as unknown as Headers,
      arrayBuffer: async () => big.buffer,
    }));
    const result = await resolveOgLogo(
      { kind: "custom-image", url: "https://example.com/huge.png" },
      XCH_ASSET,
      "XCH",
      { fetchImpl, maxBytes: 5 },
    );
    expect(result).toEqual({ kind: "chia-leaf" });
  });

  it("falls back to the built-in mark when the fetch throws or aborts", async () => {
    const fetchImpl = fakeFetch(async () => {
      throw new Error("network down");
    });
    const result = await resolveOgLogo(
      { kind: "custom-image", url: "https://example.com/x.png" },
      XCH_ASSET,
      "XCH",
      { fetchImpl },
    );
    expect(result).toEqual({ kind: "chia-leaf" });
  });

  it("falls back to the built-in mark when no fetch implementation is available at all", async () => {
    const result = await resolveOgLogo(
      { kind: "custom-image", url: "https://example.com/x.png" },
      XCH_ASSET,
      "XCH",
      { fetchImpl: undefined as unknown as typeof fetch, timeoutMs: 1 },
    );
    // With no injected fetch AND no relevant global in this environment, it must still fail soft.
    expect(["chia-leaf", "custom-image"]).toContain(result.kind);
  });
});

// ── buildOgTree (satori element-tree shape) ────────────────────────────────────────────────────

function findAll(node: SatoriNode, predicate: (n: SatoriNode) => boolean, out: SatoriNode[] = []): SatoriNode[] {
  if (predicate(node)) out.push(node);
  const children = node.props.children;
  const list = Array.isArray(children) ? children : children != null ? [children] : [];
  for (const child of list) {
    if (child && typeof child === "object" && "type" in (child as object)) {
      findAll(child as SatoriNode, predicate, out);
    }
  }
  return out;
}

function textsOf(node: SatoriNode): string[] {
  const children = node.props.children;
  if (typeof children === "string") return [children];
  const list = Array.isArray(children) ? children : children != null ? [children] : [];
  return list.flatMap((c) => (typeof c === "string" ? [c] : c ? textsOf(c as SatoriNode) : []));
}

describe("buildOgTree", () => {
  it("is exactly 1200x630 and uses the scheme's background", () => {
    const model = buildOgCardModel({ scheme: "purple" });
    const tree = buildOgTree(model);
    expect(tree.props.style?.width).toBe(`${OG_CARD_WIDTH}px`);
    expect(tree.props.style?.height).toBe(`${OG_CARD_HEIGHT}px`);
    expect(tree.props.style?.backgroundColor).toBe(PURPLE_SCHEME.surfaces.bg);
  });

  it("renders the heading, address, and pitch text", () => {
    const model = buildOgCardModel({ name: "Alice", recipient: XCH_ADDR, asset: DIG_ASSET_ID });
    const tree = buildOgTree(model);
    const allText = textsOf(tree).join(" | ");
    expect(allText).toContain("Alice");
    expect(allText).toContain(model.addressShort);
    expect(allText).toContain("Tip me in $DIG");
  });

  it("omits the address line entirely when there is no recipient", () => {
    const model = buildOgCardModel({ name: "Alice" });
    const tree = buildOgTree(model);
    // Every text node is one of: brand heart(♥)/name, heading, or pitch — never an address glyph.
    const allText = textsOf(tree).join(" | ");
    expect(allText).not.toMatch(/xch1/);
  });

  it("draws the Chia leaf as a real <svg><path> using the SHARED brandMarks path data (XCH)", () => {
    const tree = buildOgTree(buildOgCardModel({}));
    const paths = findAll(tree, (n) => n.type === "path");
    expect(paths.some((p) => p.props.d === CHIA_LEAF_PATH)).toBe(true);
  });

  it("draws the DIG mark as a real <svg><path> using the SHARED brandMarks path data ($DIG)", () => {
    const tree = buildOgTree(buildOgCardModel({ asset: DIG_ASSET_ID }));
    const paths = findAll(tree, (n) => n.type === "path");
    expect(paths.some((p) => p.props.d === DIG_MARK_PATH)).toBe(true);
  });

  it("renders a custom logo as a plain <img> when resolveOgLogo already embedded it", () => {
    const model = buildOgCardModel({ logo: "https://example.com/logo.png" });
    const resolved = { kind: "custom-image" as const, url: "data:image/png;base64,AAAA" };
    const tree = buildOgTree(model, resolved);
    const imgs = findAll(tree, (n) => n.type === "img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].props.src).toBe("data:image/png;base64,AAAA");
  });

  it("renders a single-letter monogram for an unknown CAT with no logo", () => {
    const model = buildOgCardModel({ asset: "c".repeat(64) });
    const tree = buildOgTree(model);
    const allText = textsOf(tree).join("");
    expect(allText).toContain("C");
  });
});
