# xchtip.app

Embeddable Chia **tip-widget builder**. Pick a recipient, an asset (XCH or any CAT — including
**$DIG**), and a color scheme; copy a one-line `<script>` embed onto any website. Visitors connect a
Chia wallet (WalletConnect → Sage) and tip on-chain, wallet to wallet — non-custodial, no account.

- **Builder:** https://xchtip.app/
- **Tip page (per recipient):** https://xchtip.app/jar/&lt;recipient&gt; — a standalone, shareable
  landing page with a working tip button (deterministic, backend-free: every setting lives in the URL).
  The page themes to the selected scheme end-to-end (a $DIG jar reads purple, HOA orange, …) and
  shows that asset's logo/glyph next to its name — see SPEC.md §6a.
- **Embed script:** https://xchtip.app/embed/xch-tip.js
- **Embed preview (for integrators):** https://xchtip.app/embed-preview?recipient=…&asset=…&scheme=…&name=…&logo=…
  — a chromeless, iframe-friendly route rendering ONLY the live widget for the given params (see SPEC.md §6b);
  built for the hub's Developer-tab live preview, embeddable by anyone.
- **Machine API:** query-param builder + a plain-text `/embed.txt` endpoint (see [`llms.txt`](public/llms.txt))

The normative contract (embed data-attributes, query-param API, widget wire behavior, openness) is in
[`SPEC.md`](SPEC.md). Deploy + local-run procedures are in [`runbooks/`](runbooks/).

## What it does

1. **Build.** The React app validates a recipient (bech32m Chia address), an asset (`xch`, a preset
   CAT — $DIG or HOA — or any 64-hex CAT id), and a color scheme (green / purple / orange / custom
   accent), then generates a copyable embed
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
   plain text in the SPA, and `/embed.txt?...` returns it as a real `text/plain` response. A third
   party (e.g. hub.dig.net) can also iframe `/embed-preview?...` for a live, isolated widget preview.
5. **Customize the mark.** An optional `logo=<https:// or data:image/* URL>` shows a custom coin/
   brand mark wherever the asset is named (the button's leading glyph, the jar page's "Paid in
   `<asset>`" line) — instead of the built-in Chia leaf / DIG / HOA mark. Rendered only as a hardened
   `<img>`; an invalid URL scheme or a load failure falls back to the built-in mark.
6. **Report a bug.** A floating 🐞 button (bottom-right, via the shared `@dignetwork/components`
   `<BugReportButton>`) is available on the builder and every tip-jar page, letting a visitor file a
   report — with a reviewable screenshot + console-log preview — straight to
   [DIG-Network/xchtip.app](https://github.com/DIG-Network/xchtip.app) via api.bugreport.dig.net.

## Query-param / raw API (quick reference)

```
https://xchtip.app/?recipient=xch1...&asset=xch|<catId>&scheme=green|purple|<hex>&color=<hex>&presets=1,5&label=Tip&name=Alice&logo=<url>[&raw=1]
https://xchtip.app/embed.txt?recipient=xch1...&asset=<...>&scheme=<...>&name=<...>&logo=<...>   # → text/plain snippet
https://xchtip.app/embed-preview?recipient=xch1...&asset=<...>&scheme=<...>&name=<...>&logo=<...>   # → chromeless live-widget iframe target
```

$DIG CAT asset id: `a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81`.
HOA CAT asset id: `e816ee18ce2337c4128449bc539fbbe2ecfdd2098c4e7cab4667e223c3bdc23d`.
Presets: XCH (green), $DIG (purple), HOA (orange 🍊); any other CAT via the custom asset-id input.
`logo` overrides the built-in mark with a custom `https://` or `data:image/*` URL (§5/§6 of SPEC.md).

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
  asset/scheme validation (`schemes.ts`), logo URL validation (`logo.ts`), asset-glyph resolution
  (`assetGlyph.ts` — shared by the React `AssetGlyph` component and, in future, any non-React
  renderer that needs the same mark, e.g. a per-jar OG-image generator), embed-snippet generation,
  embed-widget DOM mounting (`embedMount.ts`, shared by the jar page + embed-preview), query-param
  mapping, centralized copy.
- `src/features/builder/` — the builder hook + form + live preview + copyable output + tip-page link.
- `src/features/jar/` — the deterministic per-recipient tip-jar landing page (`/jar/<recipient>`),
  themed to the selected scheme end-to-end with the asset's logo/glyph shown next to its name.
- `src/features/embedPreview/` — the chromeless `/embed-preview` route (an iframe target for
  integrators, e.g. the hub's Developer-tab live preview).
- `src/features/raw/` — the machine-readable raw mode.
- `src/components/AssetGlyph.tsx` / `SafeLogoImage.tsx` — the coin logo/mark (custom `logo` URL >
  built-in DIG/HOA/XCH mark > text fallback), rendered ONLY as a hardened `<img>` when custom.
- `public/embed/xch-tip.js` (+ `vendor/` wasm) — the self-contained embeddable widget.
- `terraform/` — AWS infra (S3 + CloudFront + ACM + Route53) + the `/embed.txt` edge function
  (`cloudfront-function.js`, kept in agreement with `lib/embed.ts`). **No WAF; embeddable-anywhere;
  CORS `*`.**
- `scripts/` — build-time WalletConnect projectId injection, app-version injection
  (`resolve-app-version.mjs`), SEO/asset build gate.

## Notes

- **i18n** is shipped: all user-facing copy is centralized in `src/i18n/messages/` (one catalog per
  locale, English the source of truth with per-key fallback) across the ecosystem's 14 locales.
- The WalletConnect projectId is injected at build time from `$XCHTIP_WC_PROJECT_ID` and is **never**
  committed (the source ships a placeholder).
