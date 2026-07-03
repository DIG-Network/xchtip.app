import { describe, it, expect } from "vitest";
import { normalizeLogoUrl } from "./logo";

describe("normalizeLogoUrl", () => {
  it("accepts an https:// URL unchanged", () => {
    expect(normalizeLogoUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeLogoUrl("  https://example.com/logo.png  ")).toBe("https://example.com/logo.png");
  });

  it("accepts a data:image/* URL", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    expect(normalizeLogoUrl(dataUrl)).toBe(dataUrl);
    expect(normalizeLogoUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).not.toBeNull();
    expect(normalizeLogoUrl("data:image/webp;base64,AAAA")).not.toBeNull();
  });

  it("rejects javascript: URLs", () => {
    expect(normalizeLogoUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects plain http:// (only https is trusted)", () => {
    expect(normalizeLogoUrl("http://example.com/logo.png")).toBeNull();
  });

  it("rejects other schemes (file:, vbscript:, blob:)", () => {
    expect(normalizeLogoUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeLogoUrl("vbscript:msgbox(1)")).toBeNull();
    expect(normalizeLogoUrl("blob:https://example.com/uuid")).toBeNull();
  });

  it("rejects a data: URL that isn't an image mime type", () => {
    expect(normalizeLogoUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
  });

  it("returns null for empty/nullish input", () => {
    expect(normalizeLogoUrl(null)).toBeNull();
    expect(normalizeLogoUrl(undefined)).toBeNull();
    expect(normalizeLogoUrl("")).toBeNull();
    expect(normalizeLogoUrl("   ")).toBeNull();
  });
});
