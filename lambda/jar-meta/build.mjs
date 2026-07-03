// build.mjs — bundle the jar-meta Lambda handler (+ the shared xchtip.app pure lib it imports:
// ../../src/lib/jar.ts, jarMeta.ts, htmlMeta.ts and their own deps) into a single CommonJS
// dist/index.js via esbuild, so terraform/jar-meta.tf's archive_file can zip `dist/` directly as the
// Lambda deployment package. No native addons here (unlike lambda/og-image) — pure JS/TS only, so a
// plain `npm ci` on any OS + this build script works and produces an identical artifact everywhere.
import { build } from "esbuild";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
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
  logLevel: "info",
});

// dist/index.js is CJS, but this package's OWN package.json says `"type": "module"` — pin dist/ to
// `commonjs` explicitly so it is correct both for a local `npm run smoke` (which imports it from
// INSIDE this package's tree) and the deployed Lambda zip (dist/ ships as its own root, where Node
// would default to CJS anyway with no parent package.json — see lambda/og-image/build.mjs, which
// hit this exact issue first).
writeFileSync(join(dist, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));

console.log("[build] wrote", dist);
