import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { resolveAppVersion } from "./scripts/resolve-app-version.mjs";

// Vitest config, kept separate from vite.config.ts so the app build (vite's types) and the test
// runner (vitest's bundled vite) don't clash on PluginOption type versions.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Same __APP_VERSION__ injection as vite.config.ts, so version.test.ts exercises the real
  // build-time constant rather than a test-only stand-in.
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      // CLAUDE.md §2.3 — CI-gated ≥80%.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
