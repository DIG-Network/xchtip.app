# Runbook — run xchtip.app locally

## Prereqs

- Node 20+ and npm.
- (Optional) A WalletConnect (Reown) projectId to exercise the widget's connect flow end-to-end.

## Install

```bash
cd modules/dapps/xchtip.app
npm install
```

## Dev server (the builder UI)

```bash
npm run dev
```

Open the printed URL (default http://localhost:5173). The builder works fully offline — validation,
snippet generation, live preview, and the shareable/raw links are all client-side.

Try the query-param API against the dev server:

- Pre-fill: `http://localhost:5173/?recipient=xch1...&asset=xch&scheme=green`
- Raw mode (snippet-only): append `&raw=1`.

(The `/embed.txt` plain-text endpoint is served by the CloudFront edge function in production, not the
Vite dev server; the SPA `raw=1` mode produces the same snippet locally.)

## Tests

```bash
npm test               # Vitest unit + component suite
npm run test:coverage  # coverage report (CI-gated ≥ 80%)
npm run lint           # ESLint (flat config; zero errors)
npm run typecheck      # tsc --noEmit
npm run test:a11y      # Playwright: axe (WCAG 2.2 AA) desktop + mobile, SEO/meta checks
```

Playwright browsers (first run): `npx playwright install --with-deps chromium`.

## Production build locally

```bash
export XCHTIP_WC_PROJECT_ID=<projectId>   # optional; injected into dist/embed/xch-tip.js
npm run build                              # → dist/  (tsc + vite + SEO gate + WC injection)
npm run preview                            # serve dist/ locally to sanity-check the build
```

## Exercising the widget

Serve a test page that includes the built widget (from `dist/` via `npm run preview`, or the deployed
asset):

```html
<script src="http://localhost:4173/embed/xch-tip.js"
        data-recipient="xch1..."
        data-asset="xch"
        data-scheme="green"
        data-wc-project-id="<projectId>"
        async></script>
```

Click the button → a WalletConnect QR appears → scan with a Chia wallet (Sage recommended) → pick an
amount → sign. The spend is built client-side and broadcast to Chia mainnet via coinset.org.

> Mainnet spends real funds. Use small amounts when testing the full sign+broadcast path.
