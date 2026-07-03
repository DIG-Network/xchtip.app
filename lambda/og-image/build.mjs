// build.mjs — bundle the OG-image Lambda handler (+ the shared xchtip.app pure lib it imports,
// ../../src/lib/ogCard.ts + its own deps) into a single CommonJS dist/index.js via esbuild, then
// stage the vendored fonts + the platform-native @resvg/resvg-js addon alongside it so
// terraform/og.tf's archive_file can zip `dist/` directly as the Lambda deployment package.
//
// IMPORTANT: run `npm ci` for THIS package on a linux/x64 (glibc) host — matching the Lambda
// nodejs20.x runtime — BEFORE this script, so npm resolves the `@resvg/resvg-js-linux-x64-gnu`
// optional dependency (the platform-native binary). Running `npm ci` on Windows/macOS stages the
// WRONG native binary; see runbooks/deploy.md "OG image Lambda" for the Docker one-liner used for a
// local/manual apply, and .github/workflows/deploy.yml for the CI path (already Linux).
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(here, "src", "handler.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: join(dist, "index.js"),
  // @resvg/resvg-js loads a native .node addon at require-time — esbuild can't (and mustn't)
  // inline that; leave it external and ship the real package directory instead (below).
  external: ["@resvg/resvg-js"],
  logLevel: "info",
});

// dist/index.js is CJS (`format: "cjs"` above) — but this package's OWN package.json says
// `"type": "module"`, and Node resolves a directory's module type by walking UP to the nearest
// package.json when the directory itself has none. Without this, `dist/index.js` would be
// (wrongly) loaded as ESM whenever something imports it from INSIDE this package's tree (e.g. a
// local `npm run smoke`) — the real deployed Lambda zip ships dist/ as its OWN root with no parent
// package.json, so it defaults to CJS there regardless, but pinning it explicitly here makes dist/
// self-describing and correct in BOTH contexts (local smoke test AND the deployed zip).
writeFileSync(join(dist, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));

cpSync(join(here, "fonts"), join(dist, "fonts"), { recursive: true });

const resvgSrc = join(here, "node_modules", "@resvg");
if (existsSync(resvgSrc)) {
  cpSync(resvgSrc, join(dist, "node_modules", "@resvg"), { recursive: true });
  console.log("[build] staged node_modules/@resvg into dist/");
} else {
  console.warn(
    "[build] node_modules/@resvg not found — run `npm ci` (on linux/x64!) before building, " +
      "or the deployed zip will be missing the native resvg addon.",
  );
}

console.log("[build] wrote", dist);
