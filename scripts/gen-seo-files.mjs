// Build gate: verify the machine-facing SEO/agent files are present in the build output (dist/) so a
// deploy never ships without them (CLAUDE.md §6.6). llms.txt / robots.txt / sitemap.xml / favicon.svg
// live in public/ and Vite copies them verbatim; this script asserts they made it into dist/ and
// fails the build (non-zero exit) if any is missing or empty. It also asserts the embed asset +
// vendored wasm are present.

import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REQUIRED = [
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "embed/xch-tip.js",
  "embed/vendor/chia_wallet_sdk_wasm_bg.js",
  "embed/vendor/chia_wallet_sdk_wasm_bg.wasm",
  "index.html",
];

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const dist = join(root, "dist");
  const missing = [];
  for (const rel of REQUIRED) {
    try {
      const s = statSync(join(dist, rel));
      if (!s.isFile() || s.size === 0) missing.push(`${rel} (empty)`);
    } catch {
      missing.push(`${rel} (missing)`);
    }
  }
  if (missing.length) {
    console.error("[gen-seo-files] build is missing required files:\n  - " + missing.join("\n  - "));
    process.exit(1);
  }
  console.log("[gen-seo-files] OK — all required SEO/agent + embed assets present in dist/.");
}

main();
