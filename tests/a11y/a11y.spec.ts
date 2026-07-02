import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

test.describe("accessibility (WCAG 2.2 AA)", () => {
  test("builder home has zero axe violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("builder with a valid snippet has zero axe violations", async ({ page }) => {
    await page.goto(`/?recipient=${XCH}&asset=xch&scheme=green`);
    await expect(page.getByTestId("snippet-output")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("custom-scheme builder state has zero axe violations", async ({ page }) => {
    await page.goto(`/?recipient=${XCH}&asset=xch&color=%237a3dff`);
    await expect(page.getByTestId("input-color-text")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("skip link + landmarks present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByText("Skip to content")).toBeAttached();
  });

  test("keyboard: the recipient field is reachable and editable", async ({ page }) => {
    await page.goto("/");
    const recipient = page.getByTestId("input-recipient");
    await recipient.focus();
    await recipient.fill(XCH);
    await expect(page.getByTestId("snippet-output")).toBeVisible();
  });
});

test.describe("SEO / machine-friendliness", () => {
  test("home has title, description, canonical, OG, JSON-LD", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/xchtip\.app/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Chia tip button/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://xchtip.app/");
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(ld).toContain("WebApplication");
  });

  test("llms.txt, robots.txt, sitemap.xml are served", async ({ request }) => {
    const llms = await request.get("/llms.txt");
    expect(llms.ok()).toBeTruthy();
    expect(await llms.text()).toContain("query-param API");

    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("embed script is served", async ({ request }) => {
    const res = await request.get("/embed/xch-tip.js");
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain("xch-tip.js");
  });

  test("raw mode returns the snippet only", async ({ page }) => {
    await page.goto(`/?recipient=${XCH}&asset=xch&raw=1`);
    const pre = page.getByTestId("raw-snippet");
    await expect(pre).toBeVisible();
    await expect(pre).toHaveText(/<script.*xch-tip\.js.*<\/script>/s);
    // No builder chrome in raw mode.
    await expect(page.getByRole("banner")).toHaveCount(0);
  });
});
