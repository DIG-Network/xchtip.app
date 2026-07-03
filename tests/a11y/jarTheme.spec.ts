import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The jar landing page themes to the SELECTED scheme's palette end-to-end (SPEC.md §6a) — the
// WHOLE page, not just accents: the <body> background, the card + well + chip surfaces, the
// borders, and the muted text are all SHADES of the scheme hue, derived by the SAME
// resolveScheme() palette the widget itself paints with (lib/schemes.ts → schemeCssVars → the
// body.jar-page token remap in styles.css). A purple jar has a dark-VIOLET page base (never the
// site's green-dark), an orange jar a warm amber-black, XCH a green-dark. The coin's logo renders
// as a prominent ~100px hero medallion under the intro copy (jar-coin), not a tiny inline glyph.
//
// AssetGlyph forwards `className="jar-coin-mark"` directly onto the leaf element it renders (the
// <svg>/<span>/<img> itself carries BOTH the class and its own data-testid) — so selectors combine
// on the SAME element (no descendant space), e.g. `getByTestId("asset-glyph-xch")`.

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const DIG = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";
const HOA = "e816ee18ce2337c4128449bc539fbbe2ecfdd2098c4e7cab4667e223c3bdc23d";

async function accentColor(page: import("@playwright/test").Page) {
  return page.locator(".jar-eyebrow").evaluate((el) => getComputedStyle(el).color);
}

// The computed <body> background-color as [r, g, b] — the page BASE tint, which must read as the
// scheme hue (channel dominance), not the site's default green-dark.
async function bodyBgChannels(page: import("@playwright/test").Page): Promise<[number, number, number]> {
  return page.evaluate(() => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(document.body).backgroundColor)!;
    return [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number];
  });
}

// The coin hero medallion is visible and prominent (~100px mark, not an inline glyph).
async function expectCoinHero(page: import("@playwright/test").Page) {
  const coin = page.getByTestId("jar-coin");
  await expect(coin).toBeVisible();
  const box = (await coin.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(100);
  expect(box.height).toBeGreaterThanOrEqual(100);
  // The "Paid in <asset>" line carries NO inline glyph — the hero block owns the mark.
  expect(await page.locator(".jar-sub svg, .jar-sub img").count()).toBe(0);
}

test.describe("jar page theming (green/purple/orange)", () => {
  test("XCH jar reads green — whole page — with the Chia-leaf hero mark", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?name=Alice`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    expect(await accentColor(page)).toBe("rgb(58, 181, 74)"); // --xch-a
    const [r, g, b] = await bodyBgChannels(page);
    expect(g).toBeGreaterThan(r); // green-dark base
    expect(g).toBeGreaterThan(b);
    await expect(page.getByTestId("asset-glyph-xch")).toBeVisible();
    await expectCoinHero(page);
    await page.screenshot({ path: `test-results/screenshots/jar-theme-green-${testInfo.project.name}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });

  test("DIG jar reads purple end-to-end — dark-violet page base, no leftover green", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?asset=${DIG}&scheme=purple&name=Alice`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    expect(await accentColor(page)).toBe("rgb(122, 61, 255)"); // --dig-a
    const [r, g, b] = await bodyBgChannels(page);
    expect(b).toBeGreaterThan(g); // violet-dark base: blue + red dominate green
    expect(r).toBeGreaterThan(g);
    await expect(page.getByTestId("asset-glyph-dig")).toBeVisible();
    await expectCoinHero(page);
    await page.screenshot({ path: `test-results/screenshots/jar-theme-purple-${testInfo.project.name}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });

  test("HOA jar reads orange end-to-end — warm amber-black page base, 🍊 hero mark", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?asset=${HOA}&scheme=orange&name=Neighborhood+HOA`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    expect(await accentColor(page)).toBe("rgb(255, 140, 26)"); // --hoa-a
    const [r, g, b] = await bodyBgChannels(page);
    expect(r).toBeGreaterThan(g); // warm base: red over green over blue
    expect(g).toBeGreaterThan(b);
    await expect(page.getByTestId("asset-glyph-hoa")).toContainText("🍊");
    await expectCoinHero(page);
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

  test("a valid custom logo URL overrides the built-in mark, at the 100px hero size", async ({ page }, testInfo) => {
    await page.goto(`/jar/${XCH}?asset=${DIG}&scheme=purple&name=Alice&logo=${encodeURIComponent(SVG_LOGO)}`);
    await expect(page.getByTestId("jar-widget")).toBeVisible();
    const img = page.locator("img.jar-coin-mark");
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", SVG_LOGO);
    const box = (await img.boundingBox())!;
    expect(Math.round(box.width)).toBe(100);
    expect(Math.round(box.height)).toBe(100);
    // The built-in DIG mark is NOT shown when a custom logo is present.
    await expect(page.getByTestId("asset-glyph-dig")).toHaveCount(0);
    await page.screenshot({ path: `test-results/screenshots/jar-custom-logo-${testInfo.project.name}.png` });
  });

  test("a broken logo URL falls back to the built-in mark (never a broken image)", async ({ page }) => {
    await page.goto(
      `/jar/${XCH}?asset=${DIG}&scheme=purple&name=Alice&logo=${encodeURIComponent("https://xchtip.app/does-not-exist-404.png")}`,
    );
    const img = page.locator("img.jar-coin-mark");
    await expect(img).toBeVisible();
    await img.evaluate((el: HTMLImageElement) => {
      el.dispatchEvent(new Event("error"));
    });
    await expect(page.getByTestId("asset-glyph-dig")).toBeVisible();
  });

  test("an unsafe logo URL scheme is ignored — the built-in mark shows instead", async ({ page }) => {
    await page.goto(`/jar/${XCH}?name=Alice&logo=${encodeURIComponent("javascript:alert(1)")}`);
    await expect(page.locator("img.jar-coin-mark")).toHaveCount(0);
    await expect(page.getByTestId("asset-glyph-xch")).toBeVisible();
  });
});
