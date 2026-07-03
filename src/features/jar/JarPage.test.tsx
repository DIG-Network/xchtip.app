// JarPage tests — the deterministic tip-jar landing page: identity, theming, the real widget
// mount (preconfigured data-* script), suggested amounts, Chia-UX copy, and the error state.

import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderIntl as render } from "@/test/intl";
import userEvent from "@testing-library/user-event";
import { JarPage } from "./JarPage";
import { parseJarPath } from "@/lib/jar";
import { DIG_ASSET_ID } from "@/lib/constants";

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
