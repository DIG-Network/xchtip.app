/// <reference types="vite/client" />

// The app's build-time semver, injected by vite.config.ts / vitest.config.ts `define` (see
// scripts/resolve-app-version.mjs). Consumed via src/lib/version.ts — import APP_VERSION from
// there rather than referencing this global directly.
declare const __APP_VERSION__: string;
