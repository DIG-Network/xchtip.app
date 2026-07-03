// version.ts exposes the app's build-time semver two ways: as a plain export (for the footer +
// the explicit BugReportButton `appVersion` prop) and via `publishAppVersion`, which writes
// `window.__APP_VERSION__` + a `<meta name="app-version">` tag so the shared bug-report widget's
// auto-detect (and any future external tooling) can find it without a prop.

import { describe, it, expect, beforeEach } from "vitest";
import { APP_VERSION, publishAppVersion } from "./version";

type WindowWithVersion = typeof window & { __APP_VERSION__?: string };

describe("APP_VERSION", () => {
  it("is a non-empty semver-like string injected at build time", () => {
    expect(typeof APP_VERSION).toBe("string");
    expect(APP_VERSION.length).toBeGreaterThan(0);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("publishAppVersion", () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta[name="app-version"]').forEach((el) => el.remove());
    delete (window as WindowWithVersion).__APP_VERSION__;
  });

  it("sets window.__APP_VERSION__", () => {
    publishAppVersion("9.9.9");
    expect((window as WindowWithVersion).__APP_VERSION__).toBe("9.9.9");
  });

  it('creates a <meta name="app-version"> tag with the version as its content', () => {
    publishAppVersion("9.9.9");
    const meta = document.head.querySelector('meta[name="app-version"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("9.9.9");
  });

  it("is idempotent — a second call updates the existing tag instead of duplicating it", () => {
    publishAppVersion("1.0.0");
    publishAppVersion("2.0.0");
    const metas = document.head.querySelectorAll('meta[name="app-version"]');
    expect(metas.length).toBe(1);
    expect(metas[0].getAttribute("content")).toBe("2.0.0");
  });

  it("defaults to APP_VERSION when called with no argument", () => {
    publishAppVersion();
    expect((window as WindowWithVersion).__APP_VERSION__).toBe(APP_VERSION);
    expect(document.head.querySelector('meta[name="app-version"]')?.getAttribute("content")).toBe(
      APP_VERSION,
    );
  });
});
