# Contributing to xchtip.app

Thanks for your interest in improving xchtip.app. This project is a dApp built on the DIG Network and Chia blockchain — please read this before opening a PR.

## Reporting an issue

File it at [github.com/DIG-Network/xchtip.app/issues](https://github.com/DIG-Network/xchtip.app/issues) with:

- what you observed vs. what you expected,
- steps to reproduce,
- the environment (browser/OS/version if applicable).

## Prerequisites

- **Node >= 18** (the package's declared minimum).
- **Playwright browsers** (installed by `npx playwright install --with-deps chromium` before running a11y tests).

## Build & test

```bash
# Install dependencies
npm ci

# Run the gate suite locally (matching CI)
npm run lint              # eslint
npm run typecheck         # tsc --noEmit
npm run test:coverage     # vitest (gated >=80% in CI)
npm run build             # production build
npm run test:a11y         # Playwright a11y/SEO suite (requires browsers)
```

The CloudFront viewer-request Lambda function (`terraform/cloudfront-function.test.mjs`) is tested separately but is part of the build gate.

## The gate

CI runs these on every PR (`.github/workflows/ci.yml`); run them locally first:

- **lint** — eslint
- **typecheck** — `tsc --noEmit`
- **test:coverage** — vitest (fails if coverage < 80%)
- **build** — Next.js production build
- **CloudFront function** — `node --test terraform/cloudfront-function.test.mjs`
- **test:a11y** — Playwright (WCAG 2.2 AA + SEO validation)

Separate required checks (`.github/workflows/`):

- **Commit format** (`.github/workflows/commitlint.yml`) — see below.
- **Version increment** (`.github/workflows/ensure-version-increment.yml`) — `package.json`'s `version` must be strictly greater than on `main`.

`main` is protected: every required check must be green, every review thread must be resolved (incl. CodeQL), and merges are squash-only.

## Commit conventions

Conventional Commits, enforced by `commitlint.config.mjs` in CI: `type(scope): summary`, where
`type` is one of `feat|fix|docs|style|refactor|perf|test|build|ci|chore`. A breaking change appends `!` and/or a `BREAKING CHANGE:` footer. The type drives the SemVer bump (`fix` → patch, `feat` → minor, `!`/`BREAKING CHANGE` → major) — bump `package.json`'s `version` before opening the PR.

## Pull requests

1. Branch from `main`.
2. Make the gate green locally (lint, typecheck, coverage, build, a11y).
3. Bump `package.json`'s `version` (patch/minor/major per the change).
4. Run `npm install --package-lock-only` to update `package-lock.json`.
5. Open a PR with a clear description of what changed and why.
6. Resolve every review thread. On merge, the release workflow tags the commit `vX.Y.Z` and deploys.

## License

Proprietary — see `LICENSE`.

