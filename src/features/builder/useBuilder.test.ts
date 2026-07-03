import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuilder, formFromQuery } from "./useBuilder";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "@/lib/constants";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const ORIGIN = "https://xchtip.test";

describe("formFromQuery", () => {
  it("returns defaults when no builder params", () => {
    const f = formFromQuery("");
    expect(f.assetChoice).toBe("xch");
    expect(f.scheme).toBe("green");
    expect(f.recipient).toBe("");
  });

  it("pre-fills from a full DIG query", () => {
    const f = formFromQuery(`?recipient=${XCH}&asset=${DIG_ASSET_ID}&scheme=purple&presets=1,5&label=Tip`);
    expect(f.recipient).toBe(XCH);
    expect(f.assetChoice).toBe("dig");
    expect(f.scheme).toBe("purple");
    expect(f.presets).toBe("1,5");
    expect(f.label).toBe("Tip");
  });

  it("maps the HOA asset id to the hoa choice", () => {
    const f = formFromQuery(`?recipient=${XCH}&asset=${HOA_ASSET_ID}&scheme=orange`);
    expect(f.assetChoice).toBe("hoa");
    expect(f.scheme).toBe("orange");
    expect(f.catId).toBe("");
  });

  it("maps a non-DIG CAT id to the cat choice + catId field", () => {
    const cat = "c".repeat(64);
    const f = formFromQuery(`?asset=${cat}`);
    expect(f.assetChoice).toBe("cat");
    expect(f.catId).toBe(cat);
  });

  it("maps a hex scheme / color param to custom", () => {
    expect(formFromQuery("?scheme=%237a3dff").scheme).toBe("custom");
    expect(formFromQuery("?scheme=%237a3dff").color).toBe("#7a3dff");
    expect(formFromQuery("?color=00aabb").scheme).toBe("custom");
    expect(formFromQuery("?color=00aabb").color).toBe("#00aabb");
  });

  it("treats asset=xch and empty asset as the xch choice", () => {
    expect(formFromQuery("?asset=xch").assetChoice).toBe("xch");
    expect(formFromQuery("?label=hi").assetChoice).toBe("xch");
  });

  it("pre-fills the display name from ?name=", () => {
    expect(formFromQuery(`?recipient=${XCH}&name=DIG+Network`).name).toBe("DIG Network");
    expect(formFromQuery(`?recipient=${XCH}`).name).toBe("");
  });
});

describe("useBuilder", () => {
  it("derives no snippet initially (empty recipient)", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    expect(result.current.derived.ok).toBe(false);
    expect(result.current.derived.snippet).toBeNull();
    expect(result.current.derived.errors.recipient).toBeDefined();
  });

  it("derives a valid snippet + links once fields are set", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    expect(result.current.derived.ok).toBe(true);
    expect(result.current.derived.snippet).toContain("xch-tip.js");
    expect(result.current.derived.snippet).toContain('data-asset="xch"');
    expect(result.current.derived.builderLink).toContain(`${ORIGIN}/?`);
    expect(result.current.derived.rawLink).toContain("raw=1");
  });

  it("threads the display name into the jar URL, snippet, and share links", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.setField("name", "DIG Network"));
    expect(result.current.derived.jarLink).toContain("name=DIG+Network");
    expect(result.current.derived.snippet).toContain('data-name="DIG Network"');
    expect(result.current.derived.builderLink).toContain("name=DIG+Network");
    expect(result.current.derived.rawLink).toContain("name=DIG+Network");
  });

  it("applyDigPreset switches to the DIG asset + purple scheme", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.applyDigPreset());
    expect(result.current.form.assetChoice).toBe("dig");
    expect(result.current.form.scheme).toBe("purple");
    expect(result.current.derived.snippet).toContain(`data-asset="${DIG_ASSET_ID}"`);
    expect(result.current.derived.snippet).toContain('data-scheme="purple"');
  });

  it("applyHoaPreset switches to the HOA asset + orange scheme", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.applyHoaPreset());
    expect(result.current.form.assetChoice).toBe("hoa");
    expect(result.current.form.scheme).toBe("orange");
    expect(result.current.derived.snippet).toContain(`data-asset="${HOA_ASSET_ID}"`);
    expect(result.current.derived.snippet).toContain('data-scheme="orange"');
  });

  it("applyXchPreset switches to xch + green", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.applyDigPreset());
    act(() => result.current.applyXchPreset());
    expect(result.current.form.assetChoice).toBe("xch");
    expect(result.current.form.scheme).toBe("green");
  });

  it("a custom color produces data-color", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.setField("scheme", "custom"));
    act(() => result.current.setField("color", "#123abc"));
    expect(result.current.derived.snippet).toContain('data-color="#123abc"');
  });

  it("an invalid custom CAT id blocks the snippet", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.setField("assetChoice", "cat"));
    act(() => result.current.setField("catId", "tooshort"));
    expect(result.current.derived.ok).toBe(false);
    expect(result.current.derived.errors.asset).toBeDefined();
  });

  it("reset returns to defaults", () => {
    const { result } = renderHook(() => useBuilder(undefined, ORIGIN));
    act(() => result.current.setField("recipient", XCH));
    act(() => result.current.reset());
    expect(result.current.form.recipient).toBe("");
    expect(result.current.derived.ok).toBe(false);
  });
});
