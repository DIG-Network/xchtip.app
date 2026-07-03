// Resolves the app's build-time semver: package.json `version`, optionally suffixed with a git
// short-SHA (e.g. "1.2.0+abc1234") when running inside a git checkout with a resolvable HEAD. A
// tarball/CI checkout without `.git` (or without `git` on PATH) just gets the plain package.json
// version — that's an accepted fallback, not an error.
//
// Shared by vite.config.ts (dev/prod builds) and vitest.config.ts (so `__APP_VERSION__` behaves
// identically under test) — ONE source of truth for how the version string is built. See
// src/lib/version.ts for how the app consumes the injected `__APP_VERSION__` constant, and
// src/App.tsx for where it's displayed/sent.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Read package.json `version`, appending `+<git-short-sha>` when git resolves one. */
export function resolveAppVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
  const version = pkg.version;
  try {
    const sha = execSync("git rev-parse --short HEAD", {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return sha ? `${version}+${sha}` : version;
  } catch {
    // No git available (tarball checkout, or git missing from PATH) — the bare package.json
    // version is a fine fallback per the task spec.
    return version;
  }
}
