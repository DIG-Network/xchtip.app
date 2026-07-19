# xchtip.app — normative specification

This is the authoritative contract for xchtip.app: a static single-page web app that BUILDS an
embeddable Chia tip button, and the self-contained widget the builder emits. An independent
reimplementation could be built against this document. Normative keywords MUST / SHOULD / MAY are
used in the RFC 2119 sense.

## 1. Overview

xchtip.app produces a one-line `<script>` embed snippet that renders a "tip" button on any web page.
A visitor clicks the button, connects a Chia wallet over WalletConnect, picks an amount, and the
widget builds + signs + broadcasts an on-chain payment (XCH or a CAT) directly to the recipient —
wallet to wallet, non-custodial. The builder itself holds no keys and touches no chain.

## 2. Assets

An asset is one of:

- **XCH** — native Chia. Wire form: the literal string `xch` (case-insensitive).
- **CAT** — a Chia Asset Token identified by its 64-hex asset id (tail hash). Wire form: the bare
  64-character lowercase hex id. An optional `0x` prefix MUST be stripped; the id MUST be lowercased.

The canonical **$DIG** CAT asset id is
`a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81` (Chia mainnet). The canonical
**HOA** CAT asset id is `e816ee18ce2337c4128449bc539fbbe2ecfdd2098c4e7cab4667e223c3bdc23d` (Chia
mainnet). Implementations MUST use these exact values for the $DIG and HOA presets and MUST NOT
invent them. $DIG, HOA, and any other CAT are all handled by the same generalized CAT path; the
presets are convenience shortcuts, and the custom-CAT input accepts any 64-hex asset id.

Decimals (for amount → base-unit conversion): XCH = 12 (1 XCH = 10¹² mojos); ecosystem CATs = 3
(1 unit = 1000 base units). The widget converts a display amount to base units accordingly.

## 3. Recipient address

A recipient MUST be a valid bech32m Chia address:

- a correct bech32m checksum (final XOR constant `0x2bc830a3`);
- an HRP of `xch` (mainnet) or `txch` (testnet);
- a decoded payload of exactly 32 bytes (the puzzle hash).

Mixed-case input MUST be rejected. The builder MUST NOT emit a snippet for an invalid recipient. The
widget spends TO the decoded 32-byte puzzle hash.

## 4. Color schemes

A scheme drives the button + modal accent:

- `green` — the default XCH scheme. Gradient `#3ab54a` → `#1f8f3a`, white text.
- `purple` — the $DIG brand scheme. Gradient `#7a3dff` → `#ff00de`, white text.
- `orange` — the HOA brand scheme. Gradient `#ff8c1a` → `#e05a00`, white text.
- `custom` — any 6-hex accent color. The gradient end is the accent darkened ~22%; the button glow is
  the accent at α = 0.34.

An invalid/absent scheme selector MUST fall back to `green` (the button always renders).

**Derived surface palette (full-page theming).** Every scheme — named or custom — additionally
resolves a FULL surface palette (`surfaces` on the resolved scheme; `deriveSurfaces()` +
`schemeCssVars()` in `src/lib/schemes.ts`): the page background, the card/well/chip surfaces, the
hairline borders, and the muted/faint text tints, all as dark, desaturated SHADES of the scheme hue
(hue held constant; surface saturation capped at 40% and scaled by the accent's own saturation;
lightness pinned per layer, `well < bg < surface < surfaceRaised < border < borderStrong`). Text
tints are lightness-pinned high enough that WCAG AA (≥4.5:1) holds on their surfaces for ANY accent
hue — contrast-safe by construction, unit-tested (`schemes.test.ts`). Hosted pages (the tip jar,
§6a) theme their ENTIRE surface with this palette; the widget itself paints only with the accent
values above, which stay byte-compatible with the widget's inlined copy.

## 5. Embed data-attribute contract (the widget wire)

The generated snippet is a single self-contained script tag:

```
<script src="https://xchtip.app/embed/xch-tip.js"
        data-recipient="<bech32m Chia address>"     REQUIRED
        data-asset="xch" | "<64-hex CAT id>"          REQUIRED
        data-scheme="green" | "purple"                OPTIONAL (default green)
        data-color="#rrggbb"                           OPTIONAL (custom accent; overrides data-scheme)
        data-amount-presets="1,5,25"                   OPTIONAL (whole units of the asset)
        data-label="Tip"                               OPTIONAL (button label)
        data-align="center" | "left" | "right"         OPTIONAL (default center)
        data-size="md" | "lg"                          OPTIONAL (default md; lg = prominent tip-page button)
        data-variant="button|compact|pill|inline|banner|card"  OPTIONAL (default button; widget style)
        data-symbol="<TICKER>"                         OPTIONAL (CAT display symbol; overrides auto)
        data-name="<display name>"                     OPTIONAL (recipient display name; shown on the card/banner variants + jar page)
        data-logo="<https:// or data:image/* URL>"     OPTIONAL (custom logo/mark; overrides the built-in DIG/HOA/XCH mark)
        data-locale="<bcp47>"                          OPTIONAL (widget UI language; default = browser)
        data-wc-project-id="<projectId>"               OPTIONAL (defaults to xchtip.app's, build-injected)
        data-target="<css selector>"                   OPTIONAL (mount container; default: inline)
        async></script>
```

Attribute semantics:

- `data-recipient` (REQUIRED) — the recipient bech32m address (§3). Missing/invalid → the widget
  renders an inert, honest error in place of the button (never a tip to nowhere).
- `data-asset` (REQUIRED) — `xch` or a 64-hex CAT id (§2). Missing/invalid → inert error.
- `data-scheme` — `green` (default), `purple`, or `orange`. Any other value → `green`.
- `data-color` — a 6-hex accent (custom scheme). When present it takes precedence over `data-scheme`.
- `data-amount-presets` — comma-separated positive amounts in whole units of the asset. Invalid
  entries are dropped; an empty/all-invalid list falls back to the asset defaults (XCH: `0.1,0.5,1`;
  CAT: `1,5,25`).
- `data-label` — a custom button label. Default: `Tip in XCH` for XCH, `Send a tip` for a CAT.
- `data-align` — button alignment within its block wrapper. Default `center`.
- `data-size` — button size: `md` (default) or `lg` (a larger, more prominent button for a dedicated
  tip page). Any other value → `md`.
- `data-variant` — the widget style: `button` (default gradient pill), `compact` (a smaller pill),
  `pill` (ghost/outline), `inline` (minimal text link), `banner` (full-width bar with a pitch), or
  `card` (a self-contained tip card with the recipient + pitch). Any other value → `button`.
- `data-symbol` — a display symbol for a CAT (e.g. `DIG`), shown on the button + amounts. Overrides
  auto-detection; XCH is always `XCH`, the canonical DIG tail is `$DIG`, the canonical HOA tail is
  `HOA`, other CATs default to `CAT`.
- `data-name` — an OPTIONAL recipient DISPLAY NAME (e.g. a handle or store label). The widget shows
  it as the title of the `card` and `banner` variants; the jar page renders it prominently above the
  recipient address. It is HARD-sanitized on ingest — whitespace runs collapse to a single space, all
  control characters are stripped, and it is capped at 64 characters — then HTML-attribute-escaped, so
  URL-sourced text can never inject markup. It NEVER replaces the full recipient address (which stays
  visible for anti-spoofing).
- `data-locale` — the widget UI language (a BCP-47 tag). Default: the visitor's browser language,
  resolved to one of the 14 supported locales (en, zh-CN, zh-TW, ko, ja, ru, es, pt-BR, fr, de, tr,
  vi, id, hi) with per-string English fallback. The tip page passes its active locale through.
- **Brand glyph / logo (§"Custom logo" below):** the button's leading mark, and the coin hero
  medallion on the jar page (§6a), follow ONE precedence resolved by `resolveAssetGlyph`
  (`src/lib/assetGlyph.ts` on the site; `glyphFor`/`buildGlyphNode` in the widget) — a custom
  `data-logo`/`logo` (if present and valid) ALWAYS wins; otherwise a Chia leaf for XCH, the DIG mark
  for the $DIG CAT, the 🍊 mark for the HOA CAT, or a heart for a custom-color scheme or any other
  CAT with no logo.
- `data-logo` — an OPTIONAL custom logo/mark URL, shown INSTEAD of the built-in DIG/HOA/XCH mark
  wherever the asset's mark appears (the button's leading glyph, the jar page's coin hero
  medallion). MUST be an `https://` URL or a `data:image/{png,jpg,jpeg,gif,webp,svg+xml};base64,` URL —
  any other scheme (`javascript:`, plain `http:`, `file:`, `blob:`, …) is silently dropped (falls
  back to the built-in mark, never a hard error). Rendered ONLY as a plain `<img src>` (never
  inline HTML/SVG markup or a CSS background), hardened with `referrerpolicy="no-referrer"`,
  `loading="lazy"`, `decoding="async"`, and fixed dimensions (no layout shift); a load failure
  (`onerror`) falls back to the built-in mark so a broken URL never leaves a broken image icon.
- `data-wc-project-id` — a WalletConnect (Reown) projectId. Absent → the widget uses xchtip.app's own
  projectId, baked into the deployed asset at build time. If NO projectId is available at all, the
  button explains the missing id on click.
- `data-target` — a CSS selector to mount into; default is inline right after the `<script>`.

The builder emits `data-color` when the scheme is custom, otherwise `data-scheme`. Attribute values
MUST be HTML-attribute-escaped.

## 6. Builder query-param API

The builder page (`/`) accepts these query parameters:

| Param       | Meaning                                                                  |
|-------------|--------------------------------------------------------------------------|
| `recipient` | recipient bech32m Chia address (§3)                                      |
| `asset`     | `xch` or a 64-hex CAT id (§2)                                            |
| `scheme`    | `green` \| `purple` \| `orange` \| a 6-hex color (treated as custom)      |
| `color`     | a 6-hex custom accent; overrides `scheme`                                |
| `presets`   | comma-separated amounts                                                  |
| `label`     | custom button label                                                     |
| `variant`   | `button`\|`compact`\|`pill`\|`inline`\|`banner`\|`card` (default `button`)        |
| `symbol`    | CAT display symbol override (e.g. `DIG`)                                 |
| `name`      | recipient display name (sanitized + capped at 64 chars; shown on the card/banner + jar page) |
| `logo`      | custom logo/mark URL (`https://` or `data:image/*`; invalid schemes are dropped, §5 data-logo) |
| `raw`       | `1` / `true` → raw (machine-readable) mode                               |
| `format`    | `raw` → equivalent to `raw=1`                                            |

Behavior:

- WITHOUT a raw flag: the params PRE-FILL the builder UI (the user can edit + copy).
- WITH `raw=1` / `format=raw`: the page renders ONLY the embed snippet as plain text inside a single
  `<pre data-testid="raw-snippet">` element (no chrome), so a JS-executing client can read it without
  scraping. Invalid params render `ERROR: invalid parameters — <field>: <message>; …` in the same
  `<pre>` (with `data-ok="false"`).

## 6a. Tip-jar pages (`/jar/<recipient>`)

A tip jar is a standalone, self-contained landing page for ONE recipient. It is **deterministic and
backend-free**: every setting rides in the URL, so the same config always maps to the same page and
the page is 100% reconstructable from the link alone (a deep link to `/jar/…` is served its own
dedicated CloudFront behavior — §11 — which returns the SPA's `index.html` with a personalized
`<head>`; the client reads the path once it loads).

Canonical URL form — parameters appear in this FIXED order, and defaults are OMITTED so equivalent
configs always mint the identical URL:

```
/jar/<recipient>                 recipient bech32m xch address (path segment; canonical lowercase)
  ?asset=<64-hex CAT id>         only when the asset is a CAT (omitted for XCH)
  &scheme=purple|orange          only for a named non-green scheme (green is the default)
  &color=%23rrggbb               only for a custom accent (implies the custom scheme)
  &presets=<a,b,c>               only when custom amount presets are set
  &label=<text>                  only when a custom button label is set
  &name=<text>                   only when a display name for the page is set
  &logo=<url>                    only when a custom logo URL is set (URL-encoded, §5 data-logo)
```

Determinism (round-trip law, tested): generating a URL from a config and parsing it back yields the
SAME config, and re-generating from that parsed config yields the SAME URL byte-for-byte. Parsing is
tolerant (a trailing slash and an uppercase recipient canonicalize to lowercase; unknown query params
are ignored for forward-compatibility). An invalid/missing recipient renders a clean error state with
a route back to the builder — never a broken page.

The page mounts the real embed widget (§8) preconfigured from the URL (with `data-size="lg"`), so it
is a working tip surface, not a mock. Each `/jar/…` URL is its OWN SEO page: a unique title,
description, canonical, and Open Graph derived from the config (§6.6 baseline). The builder emits the
canonical jar URL as the "Your tip page" share link.

When `name=<display name>` is present, the jar page renders it PROMINENTLY above the recipient
address (luxury display typography) as the human-readable identity; the FULL recipient address stays
visible directly below it (never truncated) so a lookalike name can never mask who is actually paid.
The name is sanitized identically to `data-name` (§5): whitespace collapsed, control characters
stripped, capped at 64 characters, rendered as inert text (never parsed as HTML). It also flows to
the mounted widget as `data-name` and into the page title/description/Open Graph.

**Theming (whole-page, per selected scheme).** The ENTIRE jar page — not just accents — is shades
of the resolved scheme's derived surface palette (§4): the page background is a deep, dark,
desaturated shade of the scheme hue; the card, TO/address well, and amount-preset chips are
elevated shades of the same hue; the hairline borders/dividers and the muted/faint text are
hue-tinted; and the accent details (top-edge bar, ambient glow, eyebrow, copy icon, links/focus)
carry the accent itself. Implementation: the page sets the `schemeCssVars()` `--jar-*` palette on
`<body>` (plus a `jar-page` class), and a single `body.jar-page` token remap in `styles.css`
re-points the site's base tokens (`--ink`/`--well`/`--line`/`--paper-dim`/…) at that palette — ONE
shared source (`src/lib/schemes.ts`, the same `resolveScheme()` the widget paints with), no
per-page fork. A `$DIG` jar (`scheme=purple`) reads purple end-to-end (dark-violet base); an `HOA`
jar (`scheme=orange`) reads warm amber-black; XCH (`scheme=green`, the default) reads green; a
custom accent (`color=`) tints the same surfaces from its own hue. The page is NEVER a fixed color
regardless of the asset, and text keeps WCAG AA contrast on every tinted surface (§4). The
invalid-jar error state themes to the green default (the same fail-safe as `resolveScheme`).

**Coin hero mark.** The asset's logo renders as a PROMINENT, centered hero medallion (a ~100px
mark on a scheme-tinted disc) directly under the intro copy ("Send a tip" heading + the "Paid in
`<asset>`" line) and above the recipient identity/address. The "Paid in `<asset>`" line itself is
plain text (no inline glyph — the medallion owns the mark). The mark is resolved by the SAME
precedence as the widget's own button glyph (§5 "Brand glyph / logo"): a custom `logo=` URL (if
present and valid) wins, rendered in the hardened `<img>` (§5 data-logo; `object-fit: contain`,
rounded, fixed 100×100 box, `onerror` → fallback); otherwise the Chia leaf (XCH), the DIG mark
($DIG), the 🍊 mark (HOA), or a graceful text-initial fallback for an unknown CAT with no logo
(NEVER a broken image). The medallion is decorative (`aria-hidden`) — the asset is already named
in the adjacent text.

**Personalized link-preview card (crawler-visible).** Every `/jar/<recipient>` URL carries its OWN
Open Graph/Twitter card, not the site-wide default `og.png`:

- **Image** — `og:image`/`twitter:image` point at `/og?recipient=&name=&asset=&scheme=&logo=` (§6c),
  carrying exactly the params needed to reproduce the SAME card a human visitor sees (recipient,
  asset, display name, scheme/custom color, symbol override, custom logo).
- **Text** — `<title>`/description mirror the page's own heading/description text (English; see §6c
  "Text is not localized").
- **Two delivery layers, same values, different audiences:**
  1. A JS-executing visitor's own browser tab: `JarPage` calls `applyMeta()` (`lib/meta.ts`) in a
     `useEffect`, mutating `document.head` client-side — this is what a screen reader / the tab
     title / a same-tab bookmark sees, and it reverts to the site default on unmount (SPA nav never
     leaves a stale card).
  2. A crawler that NEVER executes JS (Facebook/Twitter/Discord/Slack/most link-unfurlers): the
     `/jar/*` CloudFront behavior routes to a dedicated Lambda (`lambda/jar-meta`) that fetches the
     site's own built `index.html` and rewrites its `<head>` tags server-side (`lib/htmlMeta.ts`)
     BEFORE the response reaches the client — so the crawler gets the personalized card with zero
     JS execution. A real browser's `<body>`/bundle reference is byte-identical; only `<head>` meta
     differs, so hydration/routing is completely unaffected. An invalid/unparsable jar link (bad or
     missing recipient) is served the unmodified default shell — the SPA still renders its own
     client-side error state (§6a "invalid/missing recipient").

## 6b. Embed-preview route (`/embed-preview`)

`GET /embed-preview?<params>` is a minimal, CHROMELESS route whose sole purpose is to be **iframed
by a third-party page** (canonically hub.dig.net's Developer-tab "Embeddable Tip button" panel) to
show a real, isolated live preview of the widget for the params being edited — isolated from the
embedding page's own CSP/JS/WalletConnect state, and without any of xchtip.app's own site chrome
(header, hero, footer) bleeding into a small preview container.

Query parameters (a subset of the builder/jar contract, §6/§6a):

| Param       | Meaning                                                                  |
|-------------|---------------------------------------------------------------------------|
| `recipient` | REQUIRED — recipient bech32m Chia address (§3)                            |
| `asset`     | optional, default `xch` — `xch` or a 64-hex CAT id (§2)                   |
| `scheme`    | optional, default `green` — `green` \| `purple` \| `orange` \| a 6-hex color (custom) |
| `name`      | optional — recipient display name, sanitized IDENTICALLY to `data-name`/the jar page (§5): whitespace collapsed, control characters stripped, capped at 64 characters |
| `logo`      | optional — custom logo/mark URL (`https://` or `data:image/*`; invalid schemes dropped, §5 data-logo) |

`color`, `presets`, `label`, `symbol`, and `variant` are also accepted (the full `validateConfig`
input shape, §6), for parity with the rest of the snippet contract — but `recipient`/`asset`/
`scheme`/`name`/`logo` are the params the canonical hub integration sends, and are the ones a
consuming integration MUST rely on.

Behavior:

- **Valid params** → the page renders NOTHING but the real embed widget (§8), mounted exactly as a
  consuming site's own copy-pasted snippet would mount it (same `mountEmbedWidget` contract as the
  jar page) — no `data-size` override, no `data-target` (default inline mount), centered on the
  page via flex layout so it looks right cropped to a small preview container.
- **Missing/invalid `recipient` (or any other invalid param)** → the page renders a BLANK,
  transparent stage — no widget, no error text. The embedding page is expected to update the
  iframe `src` reactively as its own form changes, so a transient invalid/incomplete state
  (mid-edit) is normal and MUST be visually silent, not an error flash inside a small preview box.
- **Background** — the `<body>` is forced transparent (no ink/gradient site surface) for this
  route only, so the widget composites cleanly onto whatever background the embedding page uses.
- **No bug-report button** — like raw mode (§6), this route is an iframe target, not a page a human
  browses directly, so the floating bug-report launcher is omitted.
- **Reactivity** — this route has NO client-side router; each param change is a fresh navigation
  (the embedding page sets a new `iframe.src`), so the page simply re-reads its query params on
  each load. No polling or `postMessage` contract is required.
- **Frameable** — this route MUST NOT be served with `X-Frame-Options` or a `frame-ancestors` CSP
  directive that blocks framing (it inherits xchtip.app's site-wide embed-anywhere posture, §9/§10
  — the CloudFront default behavior applies no such header to any route).

Example: `https://xchtip.app/embed-preview?recipient=xch1...&asset=a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81&scheme=purple&name=Alice`

## 6c. Per-recipient OG/Twitter-card image (`/og`)

`GET /og?recipient=&name=&asset=&scheme=&color=&symbol=&logo=` MUST return `200 image/png`, exactly
**1200×630** pixels (the standard `summary_large_image` size), for ANY combination of params —
never a 4xx/5xx, never a broken/blank image. Params mirror the jar/builder contract (§6/§6a); every
field fails soft to the same green/XCH/chia-leaf default an empty jar config renders.

**Card contents**, drawn from the resolved model (heading, address, pitch, scheme, mark):

- **Heading** — the sanitized `name` (§5 `data-name` sanitization: whitespace-collapsed,
  control-chars stripped, capped at 64 chars), or the generic "Send a tip" when absent.
- **Address** — the `recipient`, shortened for display (`xch1qyqs…s0wg4qq`); omitted entirely when
  no `recipient` is given.
- **Pitch** — `Tip me in <symbol>`, where `<symbol>` is a `symbol` override or the auto-detected
  display symbol for `asset` (XCH / $DIG / HOA / CAT — §2).
- **Color** — the resolved scheme's gradient/surface palette (§4), via the EXACT SAME
  `resolveScheme()`/`deriveSurfaces()` the jar page and widget paint with — a `$DIG` card
  (`scheme=purple` or `asset=` the $DIG CAT id together with `scheme=purple`, as the builder's $DIG
  preset emits) is never visually distinguishable in hue from the live jar page. The asset mark's
  own fixed brand gradient (the $DIG disc, the HOA disc) and the page `scheme` resolve
  INDEPENDENTLY, exactly as everywhere else in the app (§4) — asset and scheme are separate params.
- **Mark** — the SAME precedence as `resolveAssetGlyph` (§6a "Coin hero mark"): a valid `logo=` URL
  wins (fetched + embedded server-side — see below), else the built-in Chia-leaf/DIG/HOA mark (drawn
  from the SAME vector path data as the browser's `<AssetGlyph>`, `lib/brandMarks.ts`, so the two
  are pixel-identical, never just "the same decision"), else a single-letter monogram fallback for
  an unrecognized CAT with no logo. Satori has no bundled color-emoji font, so the HOA 🍊 mark is
  drawn as a colored "H" monogram on the card (a documented simplification — the resolution
  precedence itself is unchanged).
- **Custom logo (`logo=`)** — an `https://` URL is fetched SERVER-SIDE (size-capped at 300 kB,
  4-second timeout) and re-embedded as a `data:` URI (satori/resvg have no browser `<img>` loader,
  so this must happen before rendering); a `data:image/*` value is used as-is. ANY failure — network
  error, timeout, non-2xx, a non-`image/*` content-type, or an oversized body — falls back to the
  built-in mark, never a broken image and never a hard error.
- **Text is not localized.** The pitch/heading text on the image itself is always English,
  regardless of the visitor's locale — the image is a static raster the visitor's browser cannot
  re-render per-locale. (The jar PAGE around it is still fully localized, §13.)

**Rendering**: satori (JSX/HTML-shaped element tree → SVG, with the same bundled Inter font weights
the site uses) + `@resvg/resvg-js` (SVG → PNG rasterization) — `lambda/og-image`. The pure
param→model mapping, sanitization, custom-logo fetch/fail-soft, and the satori element-tree shape
are ALL in `src/lib/ogCard.ts` (unit-tested with plain vitest, no satori/resvg/AWS import); the
Lambda handler is thin AWS glue only.

**Caching**: the response carries `Cache-Control: public, max-age=31536000, immutable` — a given
querystring's rendered PNG never changes — and CloudFront's cache key includes the FULL querystring
(every param above), so two different recipients/schemes/logos never collide in the cache.

**Transport**: a CloudFront `/og` behavior fronts a Lambda Function URL (`AWS_IAM` auth, invocable
ONLY via this distribution's Origin Access Control — never a bare public URL). See `terraform/og.tf`.

Example: `https://xchtip.app/og?recipient=xch1...&asset=a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81&scheme=purple&name=Alice`

## 7. Raw plain-text endpoint (`/embed.txt`)

`GET /embed.txt?<same params as §6>` MUST return the embed snippet with
`Content-Type: text/plain; charset=utf-8` and `Access-Control-Allow-Origin: *`. This is served at the
edge (a CloudFront viewer-request function) and is byte-equivalent to the snippet the SPA raw mode
renders. Invalid params return HTTP 400 with an `ERROR: …` body. This lets a non-JS client (curl, an
agent) obtain a snippet with a single GET.

## 8. Widget runtime behavior (the wire)

On button click the widget:

1. Opens its OWN WalletConnect session (`customStoragePrefix: "xch-tip"`), namespace `chia`, chain
   `chia:mainnet`, methods `chia_getAddress`, `chip0002_getAssetCoins`, `chip0002_signCoinSpends`. It
   reuses a persisted session on the same origin across page loads (WC localStorage is origin-scoped;
   cross-domain reuse is not possible). The connect prompt shows the xchtip.app brand.
2. Lets the visitor pick a preset or custom amount.
3. Builds the unsigned coin spends CLIENT-SIDE via `chia_wallet_sdk_wasm`, applying the protocol fee
   (§8a):
   - **XCH**: source the wallet's XCH coins (`chip0002_getAssetCoins`, assetId null), select enough
     to cover the amount, and build a standard spend creating a coin to the recipient puzzle hash for
     the NET amount, a coin to the fee address for the fee, and change back to the sender. No coinset
     round-trip is required beyond broadcast.
   - **CAT**: source the wallet's CAT coins for the asset id, and build a CAT ring spend with lineage
     proofs (parent puzzle+solution fetched from coinset), creating a CAT coin to the recipient puzzle
     hash for the NET amount, a CAT coin to the fee address for the fee, and change. This is the proven
     hub $DIG-tip path, generalized to any asset id.
   - **Sender key:** the sender's synthetic public key + inner puzzle hash are recovered from the
     wallet's XCH STANDARD coins (`chip0002_getAssetCoins`, no assetId) by uncurrying the bare standard
     p2 puzzle reveal (args[0] = the 48-byte synthetic pk). The synthetic key is wallet-wide, so this
     single source serves BOTH the XCH and CAT paths — the CAT coin's own puzzle is NOT used for the
     key (a wallet may return the outer CAT wrapper, which does not uncurry to the pk). This mirrors
     the hub tip builder (`pickSenderOwner` reads the key from XCH coins). A CAT tip therefore requires
     the wallet to also hold a little XCH.
   - **Low on $DIG:** for a $DIG tip, the widget shows a "Low on $DIG? Get it on TibetSwap · dexie ·
     9mm.pro" refill line on the amount screen and (on a not-enough error) the error screen.
   - **Disconnect:** the connected amount screen offers a small "Disconnect wallet" control that closes
     the WalletConnect session so a different wallet can be paired.
4. Requests a signature via `chip0002_signCoinSpends` (partialSign) and broadcasts the assembled
   spend bundle to Chia mainnet via `https://api.coinset.org/push_tx`.

The `chia_wallet_sdk_wasm` glue + `_bg.wasm` are SELF-HOSTED on the xchtip.app origin under
`/embed/vendor/` and instantiated by hand (the wasm-bindgen bundler step performed at runtime:
compile → map every wasm import module to the glue → instantiate → `__wbg_set_wasm`). The widget MUST
NOT rely on a CDN wrapper that drops `__wbg_set_wasm`.

## 8a. Protocol fee

Every tip carries a **0.1% protocol fee** paid to the xchtip.app fee address
`xch1kxdp5hsu34e2ku8p4e6f3ap27dw8fvhjghxe88dcve8n77zwekhsemh66h`, in the SAME asset as the tip.

- The fee is `floor(baseUnits / 1000)` in the asset's base units. The recipient receives the
  remainder (`baseUnits − fee`).
- If a tip is too small to carry a whole-base-unit fee (`fee == 0`) — or a fee would leave the
  recipient with nothing — NO fee coin is created and the recipient receives the entire tip.
- The fee output is a first-class coin created on the first selected coin's conditions (a CAT coin of
  the same asset for a CAT tip). It is signed + broadcast atomically with the recipient output.
- The fee is CLEARLY disclosed to the tipper, not buried: the tip modal shows an "Includes a 0.1%
  fee to xchtip.app, plus a small XCH network fee" line BEFORE the Send/Cancel actions (read before
  committing to send, not as an easy-to-miss afterthought below the button), and the builder + jar
  page carry the equivalent disclosure ("A 0.1% fee supports xchtip.app; plus a small XCH network
  fee — the rest goes straight to the recipient") as legible secondary text near the button (not
  hidden fine print). The wording NAMES the two fees SEPARATELY — the 0.1% platform fee this section
  defines, and Chia's own separate, unrelated on-chain network fee — never conflating "network fee"
  with the amount xchtip.app receives. No surface claims the tip itself is "free" — copy describing
  the tool (e.g. the header tagline) refers to using xchtip.app (no signup/account), never to the
  tip being fee-less.

## 8b. Embedder Content-Security-Policy requirements

A site that sets its own `Content-Security-Policy` and drops in the `<script src=".../xch-tip.js">`
snippet (§5) MUST ADD the following directives — merged into its existing policy, never replacing
it — so the widget can load and complete a tip. The builder UI (§ path-embed / `CspHelp`) renders
this same block, copyable, next to the embed snippet; `src/lib/embedCsp.ts` is the single source of
truth for the exact text.

```
script-src  'self' 'wasm-unsafe-eval' https://xchtip.app https://esm.sh;
style-src   'self' 'unsafe-inline';
connect-src 'self' https://xchtip.app https://esm.sh https://api.coinset.org
            wss://relay.walletconnect.org wss://relay.walletconnect.com
            https://verify.walletconnect.org https://verify.walletconnect.com
            https://pulse.walletconnect.org https://explorer-api.walletconnect.com;
frame-src   https://verify.walletconnect.org https://verify.walletconnect.com;
```

Per-directive rationale:

- **`script-src`** — `https://xchtip.app` is the `<script src>` origin itself; `https://esm.sh` is
  the pinned CDN the widget dynamically `import()`s `@walletconnect/sign-client` + `qrcode` from at
  click time (inert until then); `'wasm-unsafe-eval'` lets it compile/instantiate its self-hosted
  `chia_wallet_sdk_wasm` (§8).
- **`style-src`** — the widget injects its own `<style>` block plus inline `style="…"` attributes
  for the button/modal; it ships no external stylesheet.
- **`connect-src`** — `https://api.coinset.org` for coin lookups + broadcast; `https://xchtip.app`
  to fetch its self-hosted wasm glue/binary; the WalletConnect relay (`wss://relay.walletconnect.*`),
  its anti-phishing Verify API, telemetry (`pulse.walletconnect.org`), and wallet-registry
  (`explorer-api.walletconnect.com`) endpoints the `@walletconnect/sign-client@2.19.0` dependency
  talks to.
- **`frame-src`** — WalletConnect's Verify API loads a hidden iframe to `verify.walletconnect.{org,com}`
  as an anti-phishing check; this is internal to the sign-client dependency, not code in xch-tip.js.

Deliberately NOT included: `media-src` (the widget plays no audio/video) and an `img-src` allowance
for a fixed icon host (the widget's built-in marks are inline SVG/emoji, not `<img>` fetches). A
site using a custom `data-logo` image (§5) may need its own `img-src` entry for that image's host,
or `data:` for a `data:image/*` URI — that is embedder-specific and outside this fixed list.

The WalletConnect infrastructure hosts are not literal strings in `xch-tip.js` (they belong to the
pinned `@walletconnect/sign-client` package) and are cross-verified against hub.dig.net's own
production CSP, which embeds the SAME sign-client version for its tip widget
(`infra/modules/cloudfront-distributions/main.tf`). Re-verify this list if the widget's pinned
WalletConnect version ever changes (`embedCsp.test.ts` guards the hosts that ARE literal strings in
`xch-tip.js`: `esm.sh`, `api.coinset.org`, the wasm compile/instantiate calls, and the pinned
version string itself).

## 9. WalletConnect projectId injection

The committed widget source contains the literal placeholder `__XCHTIP_WC_PROJECT_ID__`. The deploy
build substitutes it with the value of `$XCHTIP_WC_PROJECT_ID` (or `$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
in the BUILT copy only. The real projectId MUST NEVER be committed. A build without the env var leaves
the placeholder; the widget then requires `data-wc-project-id` or shows its honest error.

## 10. Openness — no WAF, embeddable-anywhere, CORS `*` (normative)

xchtip.app EXISTS to be embedded on arbitrary third-party sites. The deployment MUST be as open as
possible:

- **No WAF.** The CloudFront distribution MUST NOT attach any web ACL (`web_acl_id`). No rate-limit
  rules, no managed rule groups.
- **No frame restrictions.** The site and the widget MUST be frameable/embeddable from ANY origin:
  no `X-Frame-Options`, no `Content-Security-Policy: frame-ancestors`. Any CSP present MUST NOT
  restrict embedding or the widget's operation (only zero-cost guards like `X-Content-Type-Options:
  nosniff` are permitted).
- **Permissive CORS.** The embed assets (`/embed/xch-tip.js`, the vendored wasm + glue), the machine
  files (`llms.txt`, `/embed.txt`, snippets), and the site generally MUST be served with
  `Access-Control-Allow-Origin: *` so any page on any domain can load them. Configured via a
  CloudFront response-headers policy.
- **No gating.** No referrer/origin gating, no geo restriction.
- **Caching.** Content-hashed build assets and the embed assets are served with a long/immutable
  `Cache-Control`. The HTML + machine text files refresh on deploy (not immutable-cached).

## 11. Deployment

Static SPA built by Vite to `dist/`, synced to a private S3 bucket, served via CloudFront (Origin
Access Control) with a DNS-validated ACM cert (us-east-1) for `xchtip.app` (+ `www`). Route53 records
live in the existing hosted zone `Z05614961P7OR8IWYYF3` (read as a data source; never created here).
The CloudFront distribution is dualstack (A + AAAA), `http2and3`, `PriceClass_All`.

The deployment runs **three** Lambdas in total. TWO of them — `/og` (§6c) and `/jar/*` (§6a) — are
Lambda **Function URLs** behind dedicated CloudFront behaviors on this distribution, described in the
rest of this section. The THIRD — the `*.xchtip.app` URL shortener — is a separate serverless stack
behind its OWN API Gateway wildcard custom domain (NOT this CloudFront distribution) and is specified
normatively in §11a.

The two Function URLs each sit behind their own Origin
Access Control (`origin_access_control_origin_type = "lambda"`, `AWS_IAM` function-URL auth) so
neither is invocable except through this distribution. Each Lambda's resource-based policy MUST grant
`cloudfront.amazonaws.com` BOTH `lambda:InvokeFunctionUrl` AND `lambda:InvokeFunction` (with a
`SourceArn` condition scoped to this distribution's ARN) — OAC-signed CloudFront requests need both;
missing either one makes the Function URL's `AWS_IAM` authorizer reject every request with a blanket
`403 Forbidden` before the function ever runs:

- **`/og`** (§6c) — `lambda/og-image`, Node 20.x, bundled with esbuild (satori + `@resvg/resvg-js`;
  the native `@resvg/resvg-js-linux-x64-gnu` addon requires building on a linux/x64 host — CI does
  this; a local/manual apply needs the same, see `runbooks/deploy.md`).
- **`/jar/*`** (§6a "Personalized link-preview card") — `lambda/jar-meta`, Node 20.x, pure JS/TS (no
  native deps, any OS builds it identically). It fetches the site's OWN built `index.html` over
  HTTPS from `SITE_ORIGIN` (the SAME distribution's default behavior → S3) rather than reading S3
  directly, so it needs NO AWS SDK / IAM S3 permissions — only outbound network access.

Both are built (`npm ci && npm run build` inside each `lambda/*` package) BEFORE `terraform apply`,
which zips each `dist/` directly (`terraform/og.tf`, `terraform/jar-meta.tf`). See
`runbooks/deploy.md`.

SPA client-side routing is resolved by a viewer-request CloudFront Function on the default cache
behavior (`terraform/cloudfront-function.js`): any request path with no dotted file extension (a
client-side route) is rewritten to `/index.html` AT THE EDGE, before it reaches the S3 origin. The
distribution has NO distribution-wide `custom_error_response` mapping — that would catch a non-2xx
from EVERY origin (S3 and both Lambda origins alike) and mask it as a 200 SPA page, hiding a genuine
OAC/auth failure on `/og` or `/jar/*` behind what looks like a working (but wrong) response. A real
error from any origin MUST surface as a real error.

## 11a. URL shortener (`*.xchtip.app`)

The shortener maps a short subdomain (`https://<code>.xchtip.app`) onto a long, deterministic tip
page (`https://xchtip.app/jar/<recipient>…`) so a recipient can hand out a memorable link. It is a
pure convenience layer: the tip PAGE is fully deterministic + backend-free, so the long `/jar` link
ALWAYS works and the shortener being unavailable never blocks tipping. Serverless backend: one Lambda
(`lambda/shortener/`) + one DynamoDB table + an API Gateway HTTP API with a WILDCARD custom domain
(`terraform/shortener.tf`), gated behind `var.enable_shortener`. Frontend client:
`src/lib/shortener.ts` + `src/features/builder/ShortLink.tsx`.

### 11a.1 Create — `POST https://api.xchtip.app/shorten`

- Request body MUST be JSON `{ "url": string }`. A non-JSON body MUST yield `400`.
- The server MUST validate `url` and store it ONLY if it is a well-formed xchtip.app tip page (see the
  open-redirect guard, §11a.4); otherwise it MUST respond `400` and store nothing.
- On success the server mints a unique short code and responds `200` with
  `{ "code": string, "shortUrl": "https://<code>.xchtip.app" }`.
- If no unique code can be allocated the server MUST respond `503` (the client retries / falls back to
  the long link).
- The endpoint is CORS-open (`Access-Control-Allow-Origin: *`, `POST,OPTIONS`) because the builder
  calls it cross-origin; a `OPTIONS` preflight returns `204`.

### 11a.2 Resolve — `GET https://<code>.xchtip.app/…`

- The Lambda reads the short code from the Host subdomain label (case-insensitive, port stripped). A
  known code MUST return a **`301` permanent redirect** to the stored target URL.
- An unknown code MUST return a `302` soft-landing redirect to the apex builder (`https://xchtip.app/`).
- The apex, `www`, any RESERVED label (`www`, `api`, `app`, `mail`, `ns`, `cdn`, `assets`, `static`),
  a multi-level host, or a syntactically invalid code MUST NOT be treated as a code.
- A valid short code is 3–16 chars from the unambiguous alphabet
  `abcdefghjkmnpqrstvwxyz23456789` (lowercase; excludes `0/1/o/l/i/u`).

### 11a.3 Storage — DynamoDB item shape

- Table `xchtip-shortlinks`, `PAY_PER_REQUEST`, hash key `code` (String), no sort key.
- Item shape: `{ code: string (PK), target: string (the canonicalized `/jar` URL), created_at:
  ISO-8601 string }`.
- Codes are minted with a conditional put (`attribute_not_exists(code)`) and retried on collision, so a
  code is never reassigned to a different target.

### 11a.4 Open-redirect guard (SECURITY — normative)

The shortener MUST NOT become an open redirector. On CREATE the server MUST accept a target ONLY when
ALL hold, and MUST reject (`400`, store nothing) otherwise:

- the URL parses and its scheme is exactly `https:`;
- its host is exactly `xchtip.app` or `www.xchtip.app`;
- its path matches `^/jar/[^/]` (a tip page).

An accepted target is canonicalized (host forced to the apex, dropping any `www.`) before storage, so
every short link resolves to a single origin. Because ONLY `https://xchtip.app/jar/*` targets can ever
be stored, a `301` from any `<code>.xchtip.app` can only ever land on an xchtip.app tip page — never an
attacker-controlled destination. This guard is implemented in `lambda/shortener/lib.mjs`
(`validateTargetUrl`) and is unit-tested there.

### 11a.5 Custom domains + TLS

A single wildcard ACM certificate covers `*.xchtip.app` (SAN `api.xchtip.app`), DNS-validated. TWO API
Gateway custom domains map to the ONE HTTP API: the wildcard `*.xchtip.app` (resolve) and
`api.xchtip.app` (create). Both are dualstack Route53 alias records (A + AAAA) to the regional API
Gateway domains. The wildcard custom domain means every `<code>.xchtip.app` reaches the API with no
per-code DNS record; the Lambda derives the code from the Host header.

### 11a.6 Client

`src/lib/shortener.ts` is the thin fetch client (`POST {VITE_SHORTENER_API}/shorten`). The API base is
injected at build time via `VITE_SHORTENER_API`; when it is absent the shortener is treated as
unavailable and `src/features/builder/ShortLink.tsx` renders NOTHING (the long `/jar` link is always
shown above it). A request failure surfaces a quiet, honest message and keeps the affordance
actionable — the deterministic link never depends on the shortener.

## 12. Accessibility + machine-friendliness

The site MUST meet WCAG 2.2 AA (semantic landmarks, skip link, labelled controls, keyboard
operability, visible focus, sufficient contrast, `axe` 0 violations desktop + mobile) and ship
`llms.txt`, `robots.txt`, `sitemap.xml`, and full SEO meta (title/description/canonical/OG/Twitter +
schema.org JSON-LD). Interactive elements expose stable `data-testid`s.

### 12a. Bug reporting

The app shell (`src/App.tsx`) mounts the shared `@dignetwork/components` `<BugReportButton
repo="xchtip.app">` once, on every human-facing view (the builder AND every `/jar/<recipient>`
state, valid or invalid) — `data-testid="bugreport-launcher"`, fixed bottom-right. It is OMITTED in
raw mode (`?...&raw=1` / `/embed.txt`), which renders only the machine-readable snippet with no
chrome. Reports submit to `https://api.bugreport.dig.net` and file into the
`DIG-Network/xchtip.app` GitHub repo; the component owns its own accessibility (focus trap,
`role="dialog"`, live-region status) and anti-abuse contract — xchtip.app does not reimplement any
of it. See `@dignetwork/components`' own `SPEC.md` for the normative wire contract.

## 13. Internationalization (follow-up)

All user-facing copy is centralized in `src/lib/strings.ts` with stable keys. i18n (react-intl + the
ecosystem's standard locale set) is a planned follow-up; the centralization is the seam for it. Brand
and scheme literals ($DIG, XCH, `xch://`, hex colors) are preserved verbatim.
