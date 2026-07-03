// version.ts — the app's build-time semver, injected by Vite's `define` (see vite.config.ts /
// vitest.config.ts, both sourcing scripts/resolve-app-version.mjs from package.json + an optional
// git short-SHA suffix).
//
// Exposed two ways so every consumer can find it:
//   1. `APP_VERSION` — imported directly (the footer, the explicit `appVersion` prop on
//      <BugReportButton> — belt-and-suspenders so it's captured even on a components version that
//      predates auto-detection).
//   2. `publishAppVersion()` — writes `window.__APP_VERSION__` + a `<meta name="app-version">` tag
//      so the shared @dignetwork/components bug-report widget's auto-detect (prop > meta tag >
//      window global) picks it up without any wiring on this app's part, and so any other external
//      tooling has a stable, documented place to read the running build's version from.

/** The app's build-time version string, e.g. "1.2.0" or "1.2.0+abc1234". */
export const APP_VERSION: string = __APP_VERSION__;

type WindowWithVersion = typeof window & { __APP_VERSION__?: string };

/**
 * Publishes the app version for external auto-detection: sets `window.__APP_VERSION__` and a
 * `<meta name="app-version">` tag in `<head>`. Call once at boot (src/main.tsx). Idempotent — a
 * repeat call (e.g. React StrictMode's double-invoke, or a second import) updates the existing
 * meta tag in place rather than duplicating it.
 */
export function publishAppVersion(version: string = APP_VERSION): void {
  if (typeof window !== "undefined") {
    (window as WindowWithVersion).__APP_VERSION__ = version;
  }
  if (typeof document !== "undefined") {
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="app-version"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "app-version");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", version);
  }
}
