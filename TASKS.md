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

## FLAG TO ORCHESTRATOR (out of xchtip single-writer scope)

- CLAUDE.md §6.4 loading/error rule → generalize to ALL UI across the ecosystem (user request).
- hub.dig.net dig-tip.js has the SAME readSenderKey bug (parseP2Standard etc. don't exist) → fix hub.
- Extract modules/services/hub.dig.net/apps/web/tests/integration/wallet-emulator/ into its OWN git
  submodule (e.g. @dignetwork/wallet-emulator) for reuse across every frontend submodule (user
  request). Superproject + hub change — orchestrator owns .gitmodules + the extraction.

## OPEN (2026-07-02, even later)

- [x] **Widget locale honoring** — DONE (3d16ea9, deployed): data-locale + navigator.language, inline
      14-locale catalog + wt(), modal fully translated; tip page passes its locale through. Verified live.
- [x] **Full internationalization (site)** — DONE (7b2bab8/9083d79, deployed): react-intl, 14 locales,
      language selector, detection + persistence. Verified live in Japanese + Spanish.
- [x] **Social/OG card + icons** — DONE (2797df1, deployed): og.png (1200x630), favicon/apple-touch/
      192/512, manifest. Verified live (og.png 200).
- [ ] **Widget iframe isolation (WC state across sites)** — ANSWER to the user: currently the widget
      injects into the HOST page DOM (NOT an iframe), so its WalletConnect session lives in the HOST
      site's partitioned localStorage → NOT shared across embedding domains (a connect on siteA is not
      reused on siteB; browsers partition 3rd-party storage per top-level site). To share ONE WC
      session across ALL embedding sites, render the widget's interactive/modal part in an IFRAME served
      from https://xchtip.app (its own first-party origin storage). DESIGN + implement: a thin loader
      script that injects the button, opens an xchtip.app iframe for the connect+sign flow, postMessage
      between host↔iframe. Larger architectural change — scope carefully; keep the openness (embeddable,
      no frame guards) + current data-* contract.

## OPEN (2026-07-02, later)

- [ ] **Full internationalization** (like the hub, CLAUDE.md §6.6) — react-intl, externalize ALL copy
      (strings.ts already centralizes it) to a message catalog with stable ids, the ecosystem's 14
      locales (en, zh-CN, zh-TW, ko, ja, ru, es, pt-BR, fr, de, tr, vi, id, hi), locale detection +
      a language selector + persisted choice, numbers/dates/plurals via intl, preserve brand/scheme
      literals ($DIG, XCH, chia://). A completeness test that every locale covers every id. IN PROGRESS.
- [ ] **Social/OG cards + icons/logos for link embeds** — generate + export a full set: og-image
      (1200x630 twitter/OG card), favicon set, apple-touch-icon, maybe per-asset (XCH/DIG) cards. Wire
      into index.html meta + the jar page per-page OG. Self-contained (data URIs or static files in
      public/). Use a considered xchtip visual identity.
- [x] **Shortener LIVE + integrated** — terraform applied (api.xchtip.app + *.xchtip.app 301);
      VITE_SHORTENER_API baked; "Create short link" visible on the live builder; POST /shorten → short
      url verified; short link 301→jar verified. Embed cache header fixed (max-age=300 revalidate).
- [x] **DIG refill link + Disconnect wallet + CAT sender-key-from-XCH** — DONE (b47f34c), deployed.

- [x] **P0 root cause = STALE CACHE, not the fix.** The uncurry fix IS correct — PROVEN in Node
      against a real synthetic key + the standard puzzle reveal (standardSpend(pk,inner).puzzle),
      matching hub lib/chia-address.ts syntheticPkHexFromCoinPuzzle exactly (recovered pk === expected).
      BUT the embed /embed/xch-tip.js is served `Cache-Control: max-age=31536000, immutable` at a STABLE
      url → browsers/CDN keep the OLD broken widget forever. FIX: short cache + revalidate for the
      embed script + vendored wasm (stable-path assets), keep hashed assets immutable. (terraform.)
- [ ] **CLAUDE.md: document chia-wallet-sdk-wasm** as the canonical wasm for Chia spend/keys/puzzle
      work (uncurry synthetic pk, standardSpend, CAT spends) + chip35_dl_coin for DL/CAT spend bundles
      — so it's never forgotten. SUPERPROJECT file → FLAG TO ORCHESTRATOR (out of xchtip scope).
- [ ] **Disconnect wallet** — add a very small "Disconnect" control in the widget (clears the WC
      session so the user can reconnect a different wallet). Loading/idle states.
- [ ] **DIG refill link** — when tipping in $DIG (and the wallet lacks enough), show a message in the
      widget linking to refill DIG, like the hub tip widget. Find the hub's refill URL/UX.
- [ ] **CAT sender-key fix (real cause)** — the CAT path read the synthetic pk from the CAT coin's
      puzzle (outer CAT puzzle from Sage) → uncurry args[0] is NOT the pk → error. The HUB reads the
      pk from the wallet's XCH STANDARD coins (getAssetCoins, no assetId) which are always bare p2.
      FIX: source sender key from XCH coins for BOTH paths (the synthetic key is wallet-wide). This is
      the proven hub strategy (lib/tip.ts pickSenderOwner reads getAssetCoins = XCH). Do NOT parse CAT
      puzzles. VERIFIED in Node: recover from standardSpend(pk,inner).puzzle === expected pk.
- [ ] **URL shortener not visible** — ShortLink hides itself unless VITE_SHORTENER_API is set (by
      design). Backend (lambda/shortener + terraform/shortener.tf) exists but isn't provisioned/wired.
      To make it visible: provision the shortener infra (terraform -var enable_shortener=true) OR set
      VITE_SHORTENER_API at build. Lower priority than the P0 signing bug.

## Live-preview-shows-selected-style: VERIFIED working (variant radio → preview updates card/compact/button).

## New user requests (2026-07-02) — status

- [x] **BUG (P0): widget tip fails** — FIXED (e5fbfe1): synthetic-pk via uncurry().args[0].toAtom().
- [x] **Live preview = REAL working widget, grayed until recipient** — DONE (52e5850): LiveWidgetPreview.
- [x] **Brand logo on the button** — DONE (52e5850): Chia leaf (XCH) / DIG mark (\$DIG) / heart (custom).
- [x] **CAT symbol auto-detect + override** — DONE (52e5850): Dexie→Spacescan, useCatSymbol, override field.
- [x] **Tip page URL: Visit (new tab) + Copy** — DONE (52e5850).
- [x] **Widget style variants (compact/button/card)** — DONE (52e5850): data-variant + picker.
- [x] **0.1% protocol fee + subtle disclosure** — DONE (25c3565).
- [x] **All loading/error/empty/disabled states** — applied across builder/jar/shortlink/live-preview.
      (GLOBAL CLAUDE.md rule generalization flagged to orchestrator — out of xchtip scope.)

### Original P0 detail (kept for reference)

- [x] **BUG (P0): widget tip fails** — "Could not read your wallet's signing key from its coins."
      In `public/embed/xch-tip.js` `readSenderKey()` — the standard-puzzle synthetic-pk parse path
      doesn't match what the wallet returns. Reproduce, fix the parse (regression), reinstall/redeploy.
- [ ] **Live preview = the REAL working widget** — the builder's preview should be the actual
      embed widget (real tip flow), GRAYED OUT + disabled until a valid recipient is entered.
      Replaces the static `TipButtonPreview`. Loading/error/disabled states hooked up.
- [ ] **Brand logo on the button** — XCH preset → Chia logo in the button; $DIG preset → DIG logo
      (instead of the generic ♥). Custom scheme keeps the heart. Needs inline SVGs in the widget +
      the builder preview. DIG mark: modules/services/dig.net/public/brand-assets/token-svg.svg.
- [ ] **All loading + error states hooked up (UI rule)** — audit every async/stateful surface in
      xchtip.app for explicit loading + error + empty + disabled states; encode the rule in xchtip's
      own conventions (SPEC / component docs). NOTE: user also asked to add this as a GLOBAL rule in
      the superproject CLAUDE.md — that file is OUT of my single-writer scope (xchtip.app only), so
      FLAG to the orchestrator to add it to CLAUDE.md; I apply it concretely within xchtip here.
- [ ] **CAT symbol auto-detect** — for an "Other CAT" asset, auto-detect the ticker/symbol via
      Spacescan or Dexie API (by asset id), shown on the button + jar page + suggested amounts, with
      a manual OVERRIDE field. Graceful fallback to "CAT" on lookup failure. Loading/error states.
- [ ] **Tip page URL actions** — the builder's "Tip page URL" row gets a "Visit" action (opens the
      jar page in a new tab) IN ADDITION to a "Copy" button; rename the copy label to just "Copy".
- [ ] **Widget style variants** — a selectable widget STYLE: compact button, regular button (current),
      tip card, etc. New `data-variant` (append-only) on the widget + a style picker in the builder +
      live preview per variant + jar page uses card. Document in SPEC/llms.

- [ ] **0.1% protocol fee** — 0.1% of every tip is redirected to the fee address
      xch1kxdp5hsu34e2ku8p4e6f3ap27dw8fvhjghxe88dcve8n77zwekhsemh66h. Implement in the widget's spend
      build (XCH + CAT): first coin creates recipient output = amount − fee, plus a fee output to the
      fee puzzle hash; fee = floor(baseUnits * 0.001), min handling so tiny tips still net > 0. Add
      subtle disclosure text on the modal (+ jar/builder). Document in SPEC. E2E via hub emulator.

## Batched widget work (design coherently — single-writer on xch-tip.js)

These all touch the embed widget + builder; do as one coherent design pass:
brand logos (XCH=Chia leaf, $DIG=D mark, custom=heart) · style variants (compact/button/card) ·
CAT symbol auto-detect (Spacescan/Dexie + override) · live preview = real widget (grayed until
recipient) · loading/error states everywhere. Author clean inline SVGs for the glyphs (the dig.net
brand SVGs use gradient-defs/raster <image> — not inline-friendly). E2E via hub wallet-emulator.

TEST HARNESS (user-provided): use the WalletConnect emulator + test credentials in
modules/services/hub.dig.net (apps/web/tests/integration/) against LIVE mainnet to E2E-verify the
widget tip flow (connect → pick amount → sign → broadcast) — the real regression test for the P0 bug.
Never print/commit /.test-credentials or the projectId.

ROOT CAUSE FOUND (P0 bug): `readSenderKey` in xch-tip.js calls `parseP2Standard` /
`parseInnerStandardInfo` / `parseStandardPuzzle` — NONE exist on the vendored wasm `Puzzle` class,
so it ALWAYS throws. Correct API-verified path: `clvm.deserialize(reveal).uncurry().args[0].toAtom()`
= the 48-byte synthetic pk → `chia.PublicKey.fromBytes(...)`. (The hub dig-tip.js has the same latent
bug — flag for the orchestrator to fix hub too.)

## Done

- [x] UX/UI overhaul (Fable, world-class direction): "workbench after dark". Deep teal-ink surface
      + gold ("value") signal accent + Fraunces × Inter × JetBrains Mono type. Signature = the live
      button on a spotlit plinth whose glow re-lights in the chosen scheme's hue (green/purple/custom).
      CSS + markup-structure reskin only — all data-testids, logic, embed/scheme modules unchanged.
      117 unit + 18 a11y tests green (0 axe violations desktop+mobile), cov 99%, lint/typecheck/build clean.

## Paused / blocked — resume conditions

(none yet)

## Notes

- $DIG CAT asset id: a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81 (3 decimals, 1000 base units/DIG).
- DIG brand: gradient #7a3dff→#ff00de, dark card #16131f; XCH green default.
- Openness (coordinator): NO WAF, embeddable-anywhere (no frame-ancestors/X-Frame-Options),
  CORS * on embed assets, no referrer/geo/rate gating, long-immutable cache for hashed assets.
- WC projectId: build-time injection via NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (never commit); CI secret.
- i18n: not required now; centralize copy in one strings module (follow-up to bolt on later).
