# xchtip.app — task queue

Single-writer: this repo only. Do NOT touch the superproject or any other module.

## In progress

- [ ] Build xchtip.app from scratch — embeddable Chia tip-widget BUILDER dapp.

### Sub-tasks

- [x] Recon: hub dig-tip.js widget, tip-embed-core.ts, inject-embed-config.mjs, $DIG asset id,
      dig.net/apt.dig.net deploy patterns, hosted zone Z05614961P7OR8IWYYF3 (exists = xchtip.app.),
      shared state bucket dighub-tfstate + lock dighub-tflock, AWS creds (acct 873139760123).
- [ ] Project scaffold: Vite + React 18 + TS strict + ESLint flat + Vitest + Playwright.
- [ ] Pure logic module (lib/embed.ts): validation (bech32m recipient, 64-hex CAT id, scheme),
      snippet generation, query-param → config mapping, raw mode. TDD.
- [ ] Color schemes module (green default XCH, DIG purple, custom accent).
- [ ] React builder UI (form + live preview + copyable snippet), co-located tests.
- [ ] Raw mode: `?...&raw=1` renders snippet-only <pre data-testid> + /embed.txt mechanism.
- [ ] public/embed/xch-tip.js — generalized port of dig-tip.js (XCH plain spend + CAT spend),
      vendored wasm, WC projectId placeholder + inject-embed-config.mjs.
- [ ] Vendor chia_wallet_sdk_wasm glue + wasm into public/embed/vendor/.
- [ ] §6.6 baseline: llms.txt, robots.txt, sitemap.xml, SEO meta/OG/JSON-LD, a11y (axe 0 violations).
- [ ] terraform/: S3+OAC+CloudFront (NO WAF) + ACM (DNS, tolerate pending) + Route53 (data zone) +
      response-headers policy (CORS *, no frame restrictions). Remote backend (dighub-tfstate).
- [ ] SPEC.md (normative), README, runbooks/deploy.md + runbooks/local.md.
- [ ] CI: ci.yml (lint+typecheck+unit+coverage≥80%+a11y), deploy.yml (OIDC, gated).
- [ ] Ship: commit logical units, push origin/main, watch CI green.
- [ ] Deploy: terraform init/apply locally (S3+CF+cert apply now; cert validation pends on NS).

## Paused / blocked — resume conditions

(none yet)

## Notes

- $DIG CAT asset id: a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81 (3 decimals, 1000 base units/DIG).
- DIG brand: gradient #7a3dff→#ff00de, dark card #16131f; XCH green default.
- Openness (coordinator): NO WAF, embeddable-anywhere (no frame-ancestors/X-Frame-Options),
  CORS * on embed assets, no referrer/geo/rate gating, long-immutable cache for hashed assets.
- WC projectId: build-time injection via NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (never commit); CI secret.
- i18n: not required now; centralize copy in one strings module (follow-up to bolt on later).
