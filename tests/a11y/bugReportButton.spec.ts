import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The shared @dignetwork/components <BugReportButton> mounted at the app shell (src/App.tsx).
// These tests verify THIS app's integration — visible bottom-right on every real human-facing
// view, opens its panel, doesn't collide with other page UI (the jar page's tip widget) — not the
// component's own internals (covered in its own repo's test suite).
//
// Network is stubbed: no test here files a real report against api.bugreport.dig.net (per
// CLAUDE.md §6.5 / the task's "no live submission" rule). The launcher itself makes no network
// calls until opened; opening it fetches an anti-spam challenge, which we intercept.

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

async function stubBugReportApi(page: import("@playwright/test").Page) {
  await page.route("https://api.bugreport.dig.net/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/v1/challenge")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: "test-challenge-token", exp: Date.now() + 60_000 }),
      });
      return;
    }
    // Any report submission is stubbed too (defense in depth — no test here clicks Send, but a
    // stub keeps the suite from ever reaching the live service if that changes later).
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ status: "accepted", id: "test-report-id", issue: null }),
    });
  });
}

test.describe("bug-report button integration", () => {
  test("appears bottom-right on the builder and opens its panel", async ({ page }, testInfo) => {
    await stubBugReportApi(page);
    await page.goto("/");
    const launcher = page.getByTestId("bugreport-launcher");
    await expect(launcher).toBeVisible();

    const viewport = page.viewportSize();
    const box = await launcher.boundingBox();
    expect(box).not.toBeNull();
    if (box && viewport) {
      // Docked to the bottom-right quadrant of the viewport.
      expect(box.x + box.width).toBeGreaterThan(viewport.width * 0.7);
      expect(box.y + box.height).toBeGreaterThan(viewport.height * 0.7);
    }
    await page.screenshot({
      path: `test-results/screenshots/builder-bugreport-closed-${testInfo.project.name}.png`,
      fullPage: false,
    });

    await launcher.click();
    const panel = page.getByTestId("bugreport-panel");
    await expect(panel).toBeVisible();
    await expect(page.getByRole("heading", { name: "Report a bug" })).toBeVisible();
    await page.screenshot({
      path: `test-results/screenshots/builder-bugreport-open-${testInfo.project.name}.png`,
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(launcher).toBeFocused();
  });

  test("appears bottom-right on a /jar/ page without overlapping the tip widget", async ({ page }, testInfo) => {
    await stubBugReportApi(page);
    await page.goto(`/jar/${XCH}?name=Alice`);
    const launcher = page.getByTestId("bugreport-launcher");
    await expect(launcher).toBeVisible();

    // Measure the ACTUAL rendered tip button, not its flex container: `.jar-widget` is a
    // full-width flex row (centers its child), so its own box spans nearly the whole card even
    // though the visible pill is narrower and centered — comparing against the container would
    // flag a false-positive graze that isn't a real visual collision.
    const widget = page.getByTestId("jar-widget");
    const tipButton = widget.getByRole("button");
    await expect(tipButton).toBeVisible();

    const launcherBox = await launcher.boundingBox();
    const tipButtonBox = await tipButton.boundingBox();
    expect(launcherBox).not.toBeNull();
    expect(tipButtonBox).not.toBeNull();
    if (launcherBox && tipButtonBox) {
      const overlapX = Math.max(
        0,
        Math.min(launcherBox.x + launcherBox.width, tipButtonBox.x + tipButtonBox.width) -
          Math.max(launcherBox.x, tipButtonBox.x),
      );
      const overlapY = Math.max(
        0,
        Math.min(launcherBox.y + launcherBox.height, tipButtonBox.y + tipButtonBox.height) -
          Math.max(launcherBox.y, tipButtonBox.y),
      );
      // No pixel overlap between the floating launcher and the real tip button.
      expect(overlapX * overlapY).toBe(0);
    }
    await page.screenshot({
      path: `test-results/screenshots/jar-bugreport-closed-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test("zero axe violations with the report panel open (builder)", async ({ page }) => {
    await stubBugReportApi(page);
    await page.goto("/");
    await page.getByTestId("bugreport-launcher").click();
    await expect(page.getByTestId("bugreport-panel")).toBeVisible();
    // @dignetwork/components v0.1.1 fixed the two WCAG 2.5.8 (target-size) findings that v0.1.0's
    // panel markup had (the file input + the console-log <summary> toggle) — target-size is no
    // longer disabled; this asserts zero violations across the board.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
