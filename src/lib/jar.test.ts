// jar.test.ts — the deterministic tip-jar URL contract (SPEC §jar).
//
// The same config MUST always produce the same URL (no server state), and parsing that URL MUST
// yield the same rendered config (round-trip). Defaults are omitted canonically so equivalent
// configs can't produce two different URLs.

import { describe, it, expect } from "vitest";
import { jarPath, jarUrl, parseJarPath, isJarPath, type JarConfig } from "./jar";
import { DIG_ASSET_ID } from "./constants";

const XCH_ADDR = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

function baseConfig(overrides: Partial<JarConfig> = {}): JarConfig {
  return {
    recipient: XCH_ADDR,
    asset: { kind: "xch" },
    scheme: "green",
    color: null,
    presets: null,
    label: null,
    name: null,
    ...overrides,
  };
}

describe("jarPath — canonical generation", () => {
  it("XCH + green defaults collapse to the bare path (no query)", () => {
    expect(jarPath(baseConfig())).toBe(`/jar/${XCH_ADDR}`);
  });

  it("a CAT asset rides in the canonical query", () => {
    expect(jarPath(baseConfig({ asset: { kind: "cat", assetId: DIG_ASSET_ID }, scheme: "purple" }))).toBe(
      `/jar/${XCH_ADDR}?asset=${DIG_ASSET_ID}&scheme=purple`,
    );
  });

  it("a custom color rides as color= (scheme omitted)", () => {
    expect(jarPath(baseConfig({ scheme: "custom", color: "#F5B642" }))).toBe(
      `/jar/${XCH_ADDR}?color=%23f5b642`,
    );
  });

  it("presets, label and name append in fixed order", () => {
    const p = jarPath(
      baseConfig({ presets: [1, 5, 25], label: "Buy me a coffee", name: "Alice" }),
    );
    expect(p).toBe(`/jar/${XCH_ADDR}?presets=1%2C5%2C25&label=Buy+me+a+coffee&name=Alice`);
  });

  it("recipient is lowercased canonically", () => {
    expect(jarPath(baseConfig({ recipient: XCH_ADDR.toUpperCase() }))).toBe(`/jar/${XCH_ADDR}`);
  });

  it("jarUrl prefixes the origin (default production)", () => {
    expect(jarUrl(baseConfig())).toBe(`https://xchtip.app/jar/${XCH_ADDR}`);
    expect(jarUrl(baseConfig(), "http://localhost:5173")).toBe(
      `http://localhost:5173/jar/${XCH_ADDR}`,
    );
  });

  it("is deterministic — the same config always yields the identical URL", () => {
    const a = jarPath(baseConfig({ asset: { kind: "cat", assetId: DIG_ASSET_ID }, scheme: "purple", name: "Bob" }));
    const b = jarPath(baseConfig({ asset: { kind: "cat", assetId: DIG_ASSET_ID.toUpperCase() }, scheme: "purple", name: "Bob" }));
    expect(a).toBe(b);
  });
});

describe("isJarPath", () => {
  it("matches /jar/<anything> and nothing else", () => {
    expect(isJarPath(`/jar/${XCH_ADDR}`)).toBe(true);
    expect(isJarPath("/jar/")).toBe(true);
    expect(isJarPath("/jar")).toBe(true);
    expect(isJarPath("/")).toBe(false);
    expect(isJarPath("/about")).toBe(false);
    expect(isJarPath("")).toBe(false);
  });
});

describe("parseJarPath — round-trip + validation", () => {
  it("round-trips every config shape byte-identically", () => {
    const shapes: JarConfig[] = [
      baseConfig(),
      baseConfig({ asset: { kind: "cat", assetId: DIG_ASSET_ID }, scheme: "purple" }),
      baseConfig({ scheme: "custom", color: "#7a3dff" }),
      baseConfig({ presets: [0.1, 0.5, 1], label: "Tip me", name: "Café Zoë" }),
    ];
    for (const config of shapes) {
      const path = jarPath(config);
      const [pathname, search = ""] = path.split("?");
      const parsed = parseJarPath(pathname, search);
      expect(parsed).not.toBeNull();
      expect(parsed!.ok).toBe(true);
      if (parsed!.ok) {
        expect(parsed!.config).toEqual(config);
        // …and re-generating from the parsed config yields the SAME url (full determinism).
        expect(jarPath(parsed!.config)).toBe(path);
      }
    }
  });

  it("returns null for non-jar paths (the caller routes elsewhere)", () => {
    expect(parseJarPath("/", "")).toBeNull();
    expect(parseJarPath("/about", "")).toBeNull();
  });

  it("rejects an invalid recipient with a field error", () => {
    const parsed = parseJarPath("/jar/xch1notanaddress", "");
    expect(parsed).not.toBeNull();
    expect(parsed!.ok).toBe(false);
  });

  it("rejects a missing recipient", () => {
    expect(parseJarPath("/jar/", "")!.ok).toBe(false);
    expect(parseJarPath("/jar", "")!.ok).toBe(false);
  });

  it("rejects a bad CAT id but accepts a good one", () => {
    expect(parseJarPath(`/jar/${XCH_ADDR}`, "asset=nothex")!.ok).toBe(false);
    const good = parseJarPath(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}`);
    expect(good!.ok).toBe(true);
  });

  it("tolerates a trailing slash and an uppercase recipient (canonicalizes)", () => {
    const parsed = parseJarPath(`/jar/${XCH_ADDR.toUpperCase()}/`, "");
    expect(parsed!.ok).toBe(true);
    if (parsed!.ok) expect(parsed!.config.recipient).toBe(XCH_ADDR);
  });

  it("ignores unknown query params (forward-compatible)", () => {
    const parsed = parseJarPath(`/jar/${XCH_ADDR}`, "utm_source=x&future=1");
    expect(parsed!.ok).toBe(true);
    if (parsed!.ok) expect(jarPath(parsed!.config)).toBe(`/jar/${XCH_ADDR}`);
  });
});
