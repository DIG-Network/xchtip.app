// Postbuild: bake xchtip.app's own WalletConnect (Reown) projectId into the DEPLOYED embed asset so
// the drop-in tip widget (public/embed/xch-tip.js → dist/embed/xch-tip.js) works with NO
// data-wc-project-id on the embedder's page. Runs after `vite build`.
//
// WHY a build-time substitution (not a source constant): the projectId must NOT live in committed
// source — xch-tip.js ships the literal placeholder `__XCHTIP_WC_PROJECT_ID__`; here we replace it in
// the BUILT copy under dist/ with $XCHTIP_WC_PROJECT_ID (or $NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as a
// shared fallback — the same public client id the ecosystem uses). If the env var is absent (a local
// build), we leave the placeholder untouched and the widget falls back to its honest "needs a
// projectId" path. The deploy MUST set this env/secret (see runbooks/deploy.md).
//
// Idempotent + safe: only rewrites when the env var is a non-empty value AND the placeholder is present.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PLACEHOLDER, substituteProjectId } from "./embed-config-lib.mjs";

export { substituteProjectId };

const EMBED_REL = "embed/xch-tip.js";

// Resolve the built embed file (Vite outDir is `dist`). Returns the path if it exists, or null.
export function resolveEmbedPath(root) {
  const p = join(root, "dist", EMBED_REL);
  return existsSync(p) ? p : null;
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), ".."); // repo root
  const projectId =
    process.env.XCHTIP_WC_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
  const target = resolveEmbedPath(root);

  if (!target) {
    console.log("[inject-embed-config] no built embed asset (dist/embed/xch-tip.js); skipping.");
    return;
  }
  if (!projectId.trim()) {
    console.log(
      "[inject-embed-config] XCHTIP_WC_PROJECT_ID not set; leaving the embed placeholder " +
        "(widget requires data-wc-project-id or shows its honest error). Fine for local builds.",
    );
    return;
  }
  const before = readFileSync(target, "utf8");
  if (!before.includes(PLACEHOLDER)) {
    console.log("[inject-embed-config] placeholder already substituted (or absent); nothing to do.");
    return;
  }
  writeFileSync(target, substituteProjectId(before, projectId), "utf8");
  console.log(`[inject-embed-config] injected xchtip.app WalletConnect projectId into ${target}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
