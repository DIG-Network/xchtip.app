// jarMeta.test.ts — the pure per-jar <title>/description TEXT model (#221 item 2), used by the
// server-side jar-meta Lambda. Asserts it matches JarPage.tsx's own `t("jarMetaTitleNamed"/...)`
// computation for the `en` locale byte-for-byte (same template ids + substitution order).

import { describe, it, expect } from "vitest";
import { buildJarMetaText } from "./jarMeta";
import { en } from "../i18n/messages/en";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "./constants";

const XCH = { kind: "xch" as const };
const DIG = { kind: "cat" as const, assetId: DIG_ASSET_ID };
const HOA = { kind: "cat" as const, assetId: HOA_ASSET_ID };

describe("buildJarMetaText", () => {
  it("uses the generic title + description for XCH with no display name", () => {
    const meta = buildJarMetaText({ asset: XCH, symbol: null, name: null });
    expect(meta.title).toBe(en.jarMetaTitleGeneric.replace("{asset}", "XCH"));
    expect(meta.description).toBe(en.jarMetaDescription.replace("{who}", en.jarMetaWhoGeneric).replace("{asset}", "XCH"));
  });

  it("uses the NAMED title + description when a display name is given", () => {
    const meta = buildJarMetaText({ asset: DIG, symbol: null, name: "Alice" });
    expect(meta.title).toBe(en.jarMetaTitleNamed.replace("{name}", "Alice").replace("{asset}", "$DIG"));
    expect(meta.description).toBe(en.jarMetaDescription.replace("{who}", "Alice").replace("{asset}", "$DIG"));
  });

  it("resolves the HOA symbol automatically", () => {
    const meta = buildJarMetaText({ asset: HOA, symbol: null, name: null });
    expect(meta.title).toContain("HOA");
  });

  it("a symbol override wins over auto-detection", () => {
    const meta = buildJarMetaText({ asset: { kind: "cat", assetId: "c".repeat(64) }, symbol: "SBX", name: null });
    expect(meta.title).toContain("SBX");
    expect(meta.description).toContain("SBX");
  });

  it("trims a whitespace-only name/symbol down to the generic default", () => {
    const meta = buildJarMetaText({ asset: XCH, symbol: "   ", name: "   " });
    expect(meta.title).toBe(en.jarMetaTitleGeneric.replace("{asset}", "XCH"));
  });
});
