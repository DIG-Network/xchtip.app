import { test, expect } from "@playwright/test";

// The build's semver (package.json `version` + an optional git short-SHA — see
// scripts/resolve-app-version.mjs) is exposed for the shared bug-report widget's auto-detect
// (prop > <meta name="app-version"> > window.__APP_VERSION__, per @dignetwork/components) via a
// meta tag + a window global, AND rendered subtly in the footer so a human reporter can read it
// too. See src/lib/version.ts / src/App.tsx / src/features/jar/JarPage.tsx.

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const SEMVER_RE = /^\d+\.\d+\.\d+/;

test.describe("app version exposure", () => {
  test('sets <meta name="app-version"> and window.__APP_VERSION__ on the builder', async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="app-version"]');
    await expect(meta).toHaveCount(1);
    const content = await meta.getAttribute("content");
    expect(content).toMatch(SEMVER_RE);

    const windowVersion = await page.evaluate(
      () => (window as unknown as { __APP_VERSION__?: string }).__APP_VERSION__,
    );
    expect(windowVersion).toBe(content);
  });

  test("renders the version subtly in the footer (desktop + mobile)", async ({ page }, testInfo) => {
    await page.goto("/");
    const version = page.getByTestId("app-version");
    await expect(version).toBeVisible();
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+/);

    // "Subtle": smaller + more transparent than the page's base copy, not a competing headline.
    const [fontSize, opacity, bodyFontSize] = await Promise.all([
      version.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      version.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
      page.locator("body").evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ]);
    expect(fontSize).toBeLessThan(bodyFontSize);
    expect(opacity).toBeLessThan(1);

    await page.screenshot({
      path: `test-results/screenshots/footer-version-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test("also present (meta + footer), with exactly one meta tag, on a /jar/ tip page", async ({ page }) => {
    await page.goto(`/jar/${XCH}?name=Alice`);
    await expect(page.locator('meta[name="app-version"]')).toHaveCount(1);
    await expect(page.getByTestId("app-version")).toBeVisible();
    await expect(page.getByTestId("app-version")).toHaveText(/^v\d+\.\d+\.\d+/);
  });
});
