import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { resolveAppVersion } from "./scripts/resolve-app-version.mjs";

// xchtip.app is a static SPA (S3 + CloudFront). Vite builds to ./dist; the deploy syncs it.
// public/ (llms.txt, robots.txt, sitemap.xml, embed/xch-tip.js + vendored wasm) is copied verbatim.
// The Vitest config lives in vitest.config.ts (separate file to avoid vite/vitest type-version clash).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // __APP_VERSION__ (declared in src/vite-env.d.ts, consumed via src/lib/version.ts) — the build's
  // semver read from package.json + an optional git short-SHA, baked in at build time so the
  // bug-report widget + the footer can show which build a report/screenshot came from.
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  build: {
    outDir: "dist",
    // Content-hashed asset filenames → long/immutable CloudFront cache (see terraform).
    assetsDir: "assets",
    sourcemap: false,
  },
});
