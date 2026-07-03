import { describe, it, expect } from "vitest";
import { isEmbedPreviewPath } from "./embedPreviewPath";

describe("isEmbedPreviewPath", () => {
  it("matches /embed-preview (with or without a trailing slash)", () => {
    expect(isEmbedPreviewPath("/embed-preview")).toBe(true);
    expect(isEmbedPreviewPath("/embed-preview/")).toBe(true);
  });

  it("does not match other routes", () => {
    expect(isEmbedPreviewPath("/")).toBe(false);
    expect(isEmbedPreviewPath("/jar/xch1abc")).toBe(false);
    expect(isEmbedPreviewPath("/embed-preview-extra")).toBe(false);
    expect(isEmbedPreviewPath("")).toBe(false);
  });
});
