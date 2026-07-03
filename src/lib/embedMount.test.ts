import { describe, it, expect } from "vitest";
import { mountEmbedWidget } from "./embedMount";

function container(): HTMLDivElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("mountEmbedWidget", () => {
  it("appends a real <script> tag (not innerHTML) with the required attributes", () => {
    const mount = container();
    mountEmbedWidget(mount, {
      recipient: "xch1abc",
      asset: { kind: "xch" },
      scheme: "green",
      color: null,
      presets: null,
      label: null,
      symbol: null,
      name: null,
    });
    const script = mount.querySelector("script")!;
    expect(script).not.toBeNull();
    expect(script.tagName).toBe("SCRIPT");
    expect(script.getAttribute("src")).toBe("/embed/xch-tip.js");
    expect(script.async).toBe(true);
    expect(script.getAttribute("data-recipient")).toBe("xch1abc");
    expect(script.getAttribute("data-asset")).toBe("xch");
    expect(script.getAttribute("data-scheme")).toBe("green");
  });

  it("emits data-color (not data-scheme) for a custom accent", () => {
    const mount = container();
    mountEmbedWidget(mount, {
      recipient: "xch1abc",
      asset: { kind: "xch" },
      scheme: "custom",
      color: "#7a3dff",
      presets: null,
      label: null,
      symbol: null,
      name: null,
    });
    const script = mount.querySelector("script")!;
    expect(script.getAttribute("data-color")).toBe("#7a3dff");
    expect(script.hasAttribute("data-scheme")).toBe(false);
  });

  it("sets every optional attribute when given (presets/label/symbol/variant/name/locale/size)", () => {
    const mount = container();
    mountEmbedWidget(mount, {
      recipient: "xch1abc",
      asset: { kind: "cat", assetId: "a".repeat(64) },
      scheme: "purple",
      color: null,
      presets: [1, 5, 25],
      label: "Buy me a coffee",
      symbol: "DIG",
      name: "Alice",
      variant: "card",
      locale: "fr",
      size: "lg",
      target: "#my-mount",
      logo: "https://example.com/logo.png",
    });
    const script = mount.querySelector("script")!;
    expect(script.getAttribute("data-asset")).toBe("a".repeat(64));
    expect(script.getAttribute("data-scheme")).toBe("purple");
    expect(script.getAttribute("data-amount-presets")).toBe("1,5,25");
    expect(script.getAttribute("data-label")).toBe("Buy me a coffee");
    expect(script.getAttribute("data-symbol")).toBe("DIG");
    expect(script.getAttribute("data-variant")).toBe("card");
    expect(script.getAttribute("data-name")).toBe("Alice");
    expect(script.getAttribute("data-locale")).toBe("fr");
    expect(script.getAttribute("data-size")).toBe("lg");
    expect(script.getAttribute("data-target")).toBe("#my-mount");
    expect(script.getAttribute("data-logo")).toBe("https://example.com/logo.png");
  });

  it("omits every optional attribute when not given", () => {
    const mount = container();
    mountEmbedWidget(mount, {
      recipient: "xch1abc",
      asset: { kind: "xch" },
      scheme: "green",
      color: null,
      presets: null,
      label: null,
      symbol: null,
      name: null,
    });
    const script = mount.querySelector("script")!;
    for (const attr of ["data-amount-presets", "data-label", "data-symbol", "data-variant", "data-name", "data-locale", "data-size", "data-target", "data-logo"]) {
      expect(script.hasAttribute(attr)).toBe(false);
    }
  });

  it("returns a cleanup fn that empties the container", () => {
    const mount = container();
    const cleanup = mountEmbedWidget(mount, {
      recipient: "xch1abc",
      asset: { kind: "xch" },
      scheme: "green",
      color: null,
      presets: null,
      label: null,
      symbol: null,
      name: null,
    });
    expect(mount.children.length).toBe(1);
    cleanup();
    expect(mount.children.length).toBe(0);
  });
});
