import { describe, it, expect } from "vitest";
import {
  isHexColor,
  normalizeHexColor,
  isNamedScheme,
  resolveScheme,
  GREEN_SCHEME,
  PURPLE_SCHEME,
  ORANGE_SCHEME,
} from "./schemes";

describe("isHexColor", () => {
  it.each(["#7a3dff", "7a3dff", "#FF00DE", "abcdef"])("accepts %s", (v) => {
    expect(isHexColor(v)).toBe(true);
  });
  it.each(["#7a3df", "#7a3dfff", "zzzzzz", "", null, undefined, "#123"])("rejects %s", (v) => {
    expect(isHexColor(v)).toBe(false);
  });
});

describe("normalizeHexColor", () => {
  it("adds the # and lowercases", () => {
    expect(normalizeHexColor("7A3DFF")).toBe("#7a3dff");
    expect(normalizeHexColor("#FF00DE")).toBe("#ff00de");
  });
  it("returns null for invalid input", () => {
    expect(normalizeHexColor("nope")).toBeNull();
    expect(normalizeHexColor("")).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
  });
});

describe("isNamedScheme", () => {
  it("accepts green, purple and orange", () => {
    expect(isNamedScheme("green")).toBe(true);
    expect(isNamedScheme("purple")).toBe(true);
    expect(isNamedScheme("orange")).toBe(true);
  });
  it("rejects custom / hex / junk", () => {
    expect(isNamedScheme("custom")).toBe(false);
    expect(isNamedScheme("#7a3dff")).toBe(false);
    expect(isNamedScheme("")).toBe(false);
  });
});

describe("resolveScheme", () => {
  it("resolves the green named scheme", () => {
    expect(resolveScheme("green")).toEqual(GREEN_SCHEME);
  });
  it("resolves the purple named scheme (DIG brand)", () => {
    expect(resolveScheme("purple")).toEqual(PURPLE_SCHEME);
    expect(PURPLE_SCHEME.gradientFrom).toBe("#7a3dff");
    expect(PURPLE_SCHEME.gradientTo).toBe("#ff00de");
  });
  it("resolves the orange named scheme (HOA brand)", () => {
    expect(resolveScheme("orange")).toEqual(ORANGE_SCHEME);
    expect(ORANGE_SCHEME.name).toBe("orange");
    expect(ORANGE_SCHEME.gradientFrom).toMatch(/^#[0-9a-f]{6}$/);
    expect(ORANGE_SCHEME.gradientTo).toMatch(/^#[0-9a-f]{6}$/);
  });
  it("builds a custom scheme from a hex accent with a derived gradient + shadow", () => {
    const s = resolveScheme("#7a3dff");
    expect(s.name).toBe("custom");
    expect(s.gradientFrom).toBe("#7a3dff");
    expect(s.gradientTo).toMatch(/^#[0-9a-f]{6}$/);
    expect(s.gradientTo).not.toBe(s.gradientFrom); // darkened
    expect(s.shadow).toMatch(/^rgba\(\d+,\d+,\d+,0?\.\d+\)$/);
  });
  it("falls back to green for invalid / empty selectors", () => {
    expect(resolveScheme("nonsense")).toEqual(GREEN_SCHEME);
    expect(resolveScheme("")).toEqual(GREEN_SCHEME);
    expect(resolveScheme(null)).toEqual(GREEN_SCHEME);
  });
});
