import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The jar landing page themes to the SELECTED scheme's palette end-to-end (SPEC.md §6a): the
// top-edge accent, the ambient glow, the "Send a tip" eyebrow, the address-chip accent, and the
// coin glyph next to the asset name all derive from the SAME resolveScheme() the widget itself
// paints with (lib/schemes.ts) — not a fixed color regardless of asset. See src/features/jar/JarPage.tsx.
//
// AssetGlyph forwards `className="jar-asset-glyph"` directly onto the leaf element it renders (the
// <svg>/<span>/<img> itself carries BOTH the class and its own data-testid) — so selectors combine
// on the SAME element (no descendant space), e.g. `getByTestId("asset-glyph-xch")`.

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const DIG = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";
const HOA = "e816ee18ce2337c4128449bc539fbbe2ecfdd2098c4e7cab4667e223c3bdc23d";

async function accentColor(page: import("@playwright/test").Page) {
  return page.locator(".jar-eyebrow").evaluate((el) => getComputedStyle(el).color);
}

test.describe("jar page theming (green/purple/orange)", () => {
  test("XCH jar reads green, with the Chia-leaf glyph", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?name=Alice`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    expect(await accentColor(page)).toBe("rgb(58, 181, 74)"); // --xch-a
    await expect(page.getByTestId("asset-glyph-xch")).toBeVisible();
    await page.screenshot({ path: `test-results/screenshots/jar-theme-green-${testInfo.project.name}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });

  test("DIG jar reads purple end-to-end, with the DIG mark", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?asset=${DIG}&scheme=purple&name=Alice`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    expect(await accentColor(page)).toBe("rgb(122, 61, 255)"); // --dig-a
    await expect(page.getByTestId("asset-glyph-dig")).toBeVisible();
    await page.screenshot({ path: `test-results/screenshots/jar-theme-purple-${testInfo.project.name}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });

  test("HOA jar reads orange end-to-end, with the 🍊 mark", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?asset=${HOA}&scheme=orange&name=Neighborhood+HOA`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    expect(await accentColor(page)).toBe("rgb(255, 140, 26)"); // --hoa-a
    await expect(page.getByTestId("asset-glyph-hoa")).toContainText("🍊");
    await page.screenshot({ path: `test-results/screenshots/jar-theme-orange-${testInfo.project.name}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("custom logo on the jar page", () => {
  const SVG_LOGO =
    "data:image/svg+xml;base64," +
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#ff0066"/></svg>').toString(
      "base64",
    );

  test("a valid custom logo URL overrides the built-in mark", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?asset=${DIG}&scheme=purple&name=Alice&logo=${encodeURIComponent(SVG_LOGO)}`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    const img = page.locator("img.jar-asset-glyph");
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", SVG_LOGO);
    // The built-in DIG mark is NOT shown when a custom logo is present.
    await expect(page.getByTestId("asset-glyph-dig")).toHaveCount(0);
    await page.screenshot({ path: `test-results/screenshots/jar-custom-logo-${testInfo.project.name}.png` });
  });

  test("a broken logo URL falls back to the built-in mark (never a broken image)", async ({ page }) => {
    await page.goto(
      `/jar/${XCH}?asset=${DIG}&scheme=purple&name=Alice&logo=${encodeURIComponent("https://xchtip.app/does-not-exist-404.png")}`,
    );
    const img = page.locator("img.jar-asset-glyph");
    await expect(img).toBeVisible();
    await img.evaluate((el: HTMLImageElement) => {
      el.dispatchEvent(new Event("error"));
    });
    await expect(page.getByTestId("asset-glyph-dig")).toBeVisible();
  });

  test("an unsafe logo URL scheme is ignored — the built-in mark shows instead", async ({ page }) => {
    await page.goto(`/jar/${XCH}?name=Alice&logo=${encodeURIComponent("javascript:alert(1)")}`);
    await expect(page.locator("img.jar-asset-glyph")).toHaveCount(0);
    await expect(page.getByTestId("asset-glyph-xch")).toBeVisible();
  });
});
