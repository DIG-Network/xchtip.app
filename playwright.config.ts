import { defineConfig, devices } from "@playwright/test";

// Accessibility + SEO e2e. Builds are served by `vite preview` on port 4173; the tests hit the built
// SPA (the real wired app) and run axe (WCAG 2.2 AA) at desktop + mobile widths.
export default defineConfig({
  testDir: "./tests/a11y",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Flaky-test management (#489): retry a failing test up to 2x in CI before failing the run.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
