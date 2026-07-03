# xchtip.app

Embeddable Chia **tip-widget builder**. Pick a recipient, an asset (XCH or any CAT — including
**$DIG**), and a color scheme; copy a one-line `<script>` embed onto any website. Visitors connect a
Chia wallet (WalletConnect → Sage) and tip on-chain, wallet to wallet — non-custodial, no account.

- **Builder:** https://xchtip.app/
- **Tip page (per recipient):** https://xchtip.app/jar/&lt;recipient&gt; — a standalone, shareable
  landing page with a working tip button (deterministic, backend-free: every setting lives in the URL)
- **Embed script:** https://xchtip.app/embed/xch-tip.js
- **Machine API:** query-param builder + a plain-text `/embed.txt` endpoint (see [`llms.txt`](public/llms.txt))

The normative contract (embed data-attributes, query-param API, widget wire behavior, openness) is in
[`SPEC.md`](SPEC.md). Deploy + local-run procedures are in [`runbooks/`](runbooks/).

## What it does

1. **Build.** The React app validates a recipient (bech32m Chia address), an asset (`xch` or a 64-hex
   CAT id), and a color scheme (green / purple / custom accent), then generates a copyable embed
   snippet + a live button preview + a shareable pre-fill link.
2. **Embed.** The snippet loads `embed/xch-tip.js` — a self-contained widget derived from the proven
   hub.dig.net tip widget. On click it opens its own WalletConnect session, the visitor picks an
   amount, and the widget builds + signs + broadcasts the payment (XCH = plain spend; CAT = CAT ring
   spend for that asset id).
3. **Share a tip page.** Instead of embedding, hand out `https://xchtip.app/jar/<recipient>?...` — a
   full landing page with the recipient's working tip button. It is deterministic and backend-free
   (the same config always maps to the same URL; the page is reconstructed entirely from the link),
   and each jar URL is its own SEO/Open Graph page. The builder emits this as the "Your tip page" link.
4. **Automate.** Any client can GET a snippet without the UI: `?...&raw=1` renders the snippet as
   plain text in the SPA, and `/embed.txt?...` returns it as a real `text/plain` response.

## Query-param / raw API (quick reference)

```
https://xchtip.app/?recipient=xch1...&asset=xch|<catId>&scheme=green|purple|<hex>&color=<hex>&presets=1,5&label=Tip[&raw=1]
https://xchtip.app/embed.txt?recipient=xch1...&asset=<...>&scheme=<...>   # → text/plain snippet
```

$DIG CAT asset id: `a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81`.

## Develop

```bash
npm install
npm run dev          # Vite dev server
npm test             # Vitest unit suite
npm run test:coverage
npm run lint         # ESLint (flat config, zero errors)
npm run typecheck    # tsc --noEmit
npm run build        # tsc + vite build → dist/ + SEO gate + WC projectId injection
npm run test:a11y    # Playwright axe (WCAG 2.2 AA) + SEO checks
```

See [`runbooks/local.md`](runbooks/local.md) for full local setup and
[`runbooks/deploy.md`](runbooks/deploy.md) for deploy (S3 + CloudFront + Terraform).

## Architecture

- `src/lib/` — pure, dependency-free logic (the tested single source of truth): bech32m validation,
  asset/scheme validation, embed-snippet generation, query-param mapping, centralized copy.
- `src/features/builder/` — the builder hook + form + live preview + copyable output + tip-page link.
- `src/features/jar/` — the deterministic per-recipient tip-jar landing page (`/jar/<recipient>`).
- `src/features/raw/` — the machine-readable raw mode.
- `public/embed/xch-tip.js` (+ `vendor/` wasm) — the self-contained embeddable widget.
- `terraform/` — AWS infra (S3 + CloudFront + ACM + Route53). **No WAF; embeddable-anywhere; CORS `*`.**
- `scripts/` — build-time WalletConnect projectId injection + SEO/asset build gate.

## Notes

- **i18n** is a planned follow-up. All copy is centralized in `src/lib/strings.ts` with stable keys so
  react-intl can bolt on without touching components.
- The WalletConnect projectId is injected at build time from `$XCHTIP_WC_PROJECT_ID` and is **never**
  committed (the source ships a placeholder).
