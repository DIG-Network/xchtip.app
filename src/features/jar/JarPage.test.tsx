// JarPage tests — the deterministic tip-jar landing page: identity, theming, the real widget
// mount (preconfigured data-* script), suggested amounts, Chia-UX copy, and the error state.

import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderIntl as render } from "@/test/intl";
import userEvent from "@testing-library/user-event";
import { JarPage } from "./JarPage";
import { parseJarPath } from "@/lib/jar";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "@/lib/constants";
import { APP_VERSION } from "@/lib/version";
import { GREEN_SCHEME, PURPLE_SCHEME, resolveScheme } from "@/lib/schemes";

const XCH_ADDR = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

function renderJar(pathname: string, search = "") {
  const result = parseJarPath(pathname, search)!;
  return render(<JarPage result={result} origin="https://xchtip.test" />);
}

beforeEach(() => {
  document.title = "reset";
});

describe("JarPage — valid jar", () => {
  it("renders the recipient identity: the FULL address (never truncated) + copies it", async () => {
    const user = userEvent.setup();
    renderJar(`/jar/${XCH_ADDR}`);
    const chip = screen.getByTestId("jar-address");
    // The full address must be shown — truncation would enable lookalike-address spoofing.
    expect(chip.textContent).toContain(XCH_ADDR);
    await user.click(chip);
    expect(await navigator.clipboard.readText()).toBe(XCH_ADDR);
  });

  it("mounts the REAL embed widget preconfigured for the recipient", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple`);
    const mount = screen.getByTestId("jar-widget");
    const script = mount.querySelector("script")!;
    expect(script).not.toBeNull();
    expect(script.getAttribute("src")).toBe("/embed/xch-tip.js");
    expect(script.getAttribute("data-recipient")).toBe(XCH_ADDR);
    expect(script.getAttribute("data-asset")).toBe(DIG_ASSET_ID);
    expect(script.getAttribute("data-scheme")).toBe("purple");
    expect(script.getAttribute("data-size")).toBe("lg");
    expect(script.async).toBe(true);
  });

  it("passes a custom color + presets + label through to the widget", () => {
    renderJar(`/jar/${XCH_ADDR}`, "color=%23f5b642&presets=2%2C4&label=Buy+me+a+coffee");
    const script = screen.getByTestId("jar-widget").querySelector("script")!;
    expect(script.getAttribute("data-color")).toBe("#f5b642");
    expect(script.getAttribute("data-amount-presets")).toBe("2,4");
    expect(script.getAttribute("data-label")).toBe("Buy me a coffee");
  });

  it("shows the display name when given, and the asset symbol", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Alice");
    expect(screen.getByTestId("jar-asset").textContent).toContain("$DIG");
  });

  it("renders the display name PROMINENTLY, above the full recipient address", () => {
    renderJar(`/jar/${XCH_ADDR}`, "name=Caf%C3%A9%20Zo%C3%AB");
    const name = screen.getByTestId("jar-name");
    expect(name.textContent).toBe("Café Zoë");
    const address = screen.getByTestId("jar-address");
    // The name renders BEFORE (above) the address; the FULL address stays visible (anti-spoofing).
    expect(name.compareDocumentPosition(address) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(address.textContent).toContain(XCH_ADDR);
  });

  it("renders an HTML-looking name as inert literal text (XSS-proof)", () => {
    renderJar(`/jar/${XCH_ADDR}`, `name=${encodeURIComponent("<img src=x onerror=alert(1)>")}`);
    const name = screen.getByTestId("jar-name");
    expect(name.textContent).toBe("<img src=x onerror=alert(1)>");
    // Nothing was parsed as markup — no element was injected anywhere in the card.
    expect(document.querySelector("img")).toBeNull();
  });

  it("caps an over-long display name (URL-sourced text is length-limited)", () => {
    renderJar(`/jar/${XCH_ADDR}`, `name=${"x".repeat(300)}`);
    expect(screen.getByTestId("jar-name").textContent).toBe("x".repeat(64));
  });

  it("passes the display name to the widget (data-name)", () => {
    renderJar(`/jar/${XCH_ADDR}`, "name=Alice");
    const script = screen.getByTestId("jar-widget").querySelector("script")!;
    expect(script.getAttribute("data-name")).toBe("Alice");
  });

  it("renders the HOA preset: the HOA symbol + orange widget scheme", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${HOA_ASSET_ID}&scheme=orange`);
    expect(screen.getByTestId("jar-asset").textContent).toContain("HOA");
    const script = screen.getByTestId("jar-widget").querySelector("script")!;
    expect(script.getAttribute("data-asset")).toBe(HOA_ASSET_ID);
    expect(script.getAttribute("data-scheme")).toBe("orange");
  });

  it("falls back to a generic heading without a name", () => {
    renderJar(`/jar/${XCH_ADDR}`);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("jar-asset").textContent).toContain("XCH");
  });

  it("shows suggested amounts (defaults per asset when none given)", () => {
    renderJar(`/jar/${XCH_ADDR}`);
    const amounts = screen.getByTestId("jar-amounts");
    expect(amounts.textContent).toContain("0.1");
    expect(amounts.textContent).toContain("1");
  });

  it("tells the Chia story (fees, speed, self-custody) and links back to the builder", () => {
    renderJar(`/jar/${XCH_ADDR}`);
    expect(screen.getByTestId("jar-benefits")).toBeInTheDocument();
    const home = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/");
    expect(home.length).toBeGreaterThan(0);
  });

  it("sets the page meta (title mentions the name/asset)", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`);
    expect(document.title).toContain("Alice");
    expect(document.title).toContain("$DIG");
  });

  it("sets a per-page canonical + Open Graph tags for the deterministic jar URL", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`);
    const canonical = document.head.querySelector('link[rel="canonical"]')!;
    expect(canonical.getAttribute("href")).toBe(
      `https://xchtip.test/jar/${XCH_ADDR}?asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`,
    );
    expect(document.head.querySelector('meta[property="og:title"]')!.getAttribute("content")).toContain(
      "Alice",
    );
    expect(document.head.querySelector('meta[property="og:url"]')!.getAttribute("content")).toContain(
      "/jar/",
    );
    expect(document.head.querySelector('meta[name="description"]')!.getAttribute("content")).toBeTruthy();
  });

  it("sets a PERSONALIZED per-recipient og:image/twitter:image (#221) pointing at /og with the same params", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`);
    const ogImage = document.head.querySelector('meta[property="og:image"]')!.getAttribute("content")!;
    const twitterImage = document.head.querySelector('meta[name="twitter:image"]')!.getAttribute("content")!;
    expect(ogImage).toBe(twitterImage);
    expect(ogImage).toMatch(/^https:\/\/xchtip\.test\/og\?/);
    expect(ogImage).toContain(`recipient=${XCH_ADDR}`);
    expect(ogImage).toContain(`asset=${DIG_ASSET_ID}`);
    expect(ogImage).toContain("scheme=purple");
    expect(ogImage).toContain("name=Alice");
  });

  it("shows the build's semver subtly in the footer", () => {
    renderJar(`/jar/${XCH_ADDR}`);
    expect(screen.getByTestId("app-version").textContent).toBe(`v${APP_VERSION}`);
  });
});

describe("JarPage — whole-page scheme theming", () => {
  it("themes the WHOLE page to the scheme: jar-page class + full surface vars on <body>", () => {
    const { unmount } = renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple`);
    expect(document.body.classList.contains("jar-page")).toBe(true);
    // The accent trio AND the surface set (bg/surfaces/borders/text tints) are all set — the page
    // background + cards + hairlines derive from the scheme, not the site's fixed green tokens.
    expect(document.body.style.getPropertyValue("--jar-accent")).toBe(PURPLE_SCHEME.gradientFrom);
    expect(document.body.style.getPropertyValue("--jar-bg")).toBe(PURPLE_SCHEME.surfaces.bg);
    expect(document.body.style.getPropertyValue("--jar-surface")).toBe(PURPLE_SCHEME.surfaces.surface);
    expect(document.body.style.getPropertyValue("--jar-well")).toBe(PURPLE_SCHEME.surfaces.well);
    expect(document.body.style.getPropertyValue("--jar-border")).toBe(PURPLE_SCHEME.surfaces.border);
    expect(document.body.style.getPropertyValue("--jar-text-muted")).toBe(PURPLE_SCHEME.surfaces.textMuted);
    unmount();
    // Leaving the jar page restores a clean body (SPA navigation never leaks the tint).
    expect(document.body.classList.contains("jar-page")).toBe(false);
    expect(document.body.style.getPropertyValue("--jar-bg")).toBe("");
  });

  it("a custom accent color themes the page surfaces from that hue", () => {
    renderJar(`/jar/${XCH_ADDR}`, "color=%23f5b642");
    expect(document.body.style.getPropertyValue("--jar-bg")).toBe(resolveScheme("#f5b642").surfaces.bg);
  });

  it("the invalid-jar error page still gets a (green default) themed body", () => {
    const result = parseJarPath("/jar/xch1notanaddress", "")!;
    render(<JarPage result={result} origin="https://xchtip.test" />);
    expect(document.body.classList.contains("jar-page")).toBe(true);
    expect(document.body.style.getPropertyValue("--jar-bg")).toBe(GREEN_SCHEME.surfaces.bg);
  });
});

describe("JarPage — coin hero mark", () => {
  it("renders the coin logo as a prominent hero block between the intro copy and the address", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple`);
    const coin = screen.getByTestId("jar-coin");
    // The DIG built-in mark renders inside the hero block…
    expect(coin.querySelector('[data-testid="asset-glyph-dig"]')).not.toBeNull();
    // …below the intro copy and above the TO/address box.
    const sub = document.querySelector(".jar-sub")!;
    const address = screen.getByTestId("jar-address");
    expect(sub.compareDocumentPosition(coin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(coin.compareDocumentPosition(address) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Decorative: the asset is already named in the copy above.
    expect(coin.getAttribute("aria-hidden")).toBe("true");
  });

  it("the 'Paid in <asset>' line is plain text — no tiny inline glyph (the hero block owns the mark)", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${DIG_ASSET_ID}&scheme=purple`);
    const sub = document.querySelector(".jar-sub")!;
    expect(sub.querySelector("svg, img")).toBeNull();
    expect(screen.getByTestId("jar-asset").textContent).toContain("$DIG");
  });

  it("a custom logo URL renders in the hero block as a hardened <img> at the 100px hero size", () => {
    const logo = "data:image/png;base64,iVBORw0KGgo=";
    renderJar(`/jar/${XCH_ADDR}`, `logo=${encodeURIComponent(logo)}`);
    const img = screen.getByTestId("jar-coin").querySelector("img")!;
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe(logo);
    expect(img.getAttribute("width")).toBe("100");
    expect(img.getAttribute("height")).toBe("100");
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("the HOA jar shows the 🍊 mark in the hero block", () => {
    renderJar(`/jar/${XCH_ADDR}`, `asset=${HOA_ASSET_ID}&scheme=orange`);
    const coin = screen.getByTestId("jar-coin");
    expect(coin.querySelector('[data-testid="asset-glyph-hoa"]')?.textContent).toContain("🍊");
  });
});

describe("JarPage — invalid jar", () => {
  it("renders a styled error state with a route back to the builder", () => {
    const result = parseJarPath("/jar/xch1notanaddress", "")!;
    render(<JarPage result={result} origin="https://xchtip.test" />);
    expect(screen.getByTestId("jar-error")).toBeInTheDocument();
    expect(screen.queryByTestId("jar-widget")).not.toBeInTheDocument();
    const home = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/");
    expect(home.length).toBeGreaterThan(0);
  });
});
