import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// /embed-preview — a chromeless route rendering ONLY the live embed widget for the given query
// params, on a transparent background, for the hub's Developer-tab live preview to iframe (see
// SPEC.md §6b, README.md, llms.txt). Query params: recipient (required), asset, scheme, name.

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const DIG = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";

test.describe("embed-preview route (hub iframe target)", () => {
  test("renders the widget with the requested scheme + name, transparent bg, no site chrome, frameable", async ({
    page,
  }, testInfo) => {
    const response = await page.goto(`/embed-preview?recipient=${XCH}&asset=${DIG}&scheme=purple&name=Alice`);

    // Frameable: no X-Frame-Options, and no frame-ancestors CSP directive if a CSP is ever added.
    const headers = response?.headers() ?? {};
    expect(headers["x-frame-options"]).toBeUndefined();
    if (headers["content-security-policy"]) {
      expect(headers["content-security-policy"]).not.toContain("frame-ancestors");
    }

    const stage = page.getByTestId("embed-preview-stage");
    await expect(stage).toBeVisible();
    const widget = page.getByTestId("embed-preview-widget");
    await expect(widget).toBeVisible();
    const script = widget.locator("script");
    await expect(script).toHaveAttribute("data-recipient", XCH);
    await expect(script).toHaveAttribute("data-asset", DIG);
    await expect(script).toHaveAttribute("data-scheme", "purple");
    await expect(script).toHaveAttribute("data-name", "Alice");

    // No site chrome — this is an iframe target, not a page a human browses directly.
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await expect(page.getByTestId("bugreport-launcher")).toHaveCount(0);

    // Transparent background — no opaque surface painted behind the widget.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(bg);

    await page.screenshot({
      path: `test-results/screenshots/embed-preview-${testInfo.project.name}.png`,
    });
  });

  test("defaults to xch + green when only recipient is given", async ({ page }) => {
    await page.goto(`/embed-preview?recipient=${XCH}`);
    const script = page.getByTestId("embed-preview-widget").locator("script");
    await expect(script).toHaveAttribute("data-asset", "xch");
    await expect(script).toHaveAttribute("data-scheme", "green");
  });

  test("renders a blank stage (no widget, no error) for a missing/invalid recipient", async ({ page }) => {
    await page.goto("/embed-preview?recipient=xch1bogus");
    await expect(page.getByTestId("embed-preview-stage")).toBeVisible();
    await expect(page.getByTestId("embed-preview-widget")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("zero axe violations", async ({ page }) => {
    await page.goto(`/embed-preview?recipient=${XCH}&asset=${DIG}&scheme=purple&name=Alice`);
    await expect(page.getByTestId("embed-preview-widget")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
