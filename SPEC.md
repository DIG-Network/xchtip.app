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
`a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81` (Chia mainnet). Implementations
MUST use this exact value for the $DIG preset and MUST NOT invent it.

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
- `custom` — any 6-hex accent color. The gradient end is the accent darkened ~22%; the button glow is
  the accent at α = 0.34.

An invalid/absent scheme selector MUST fall back to `green` (the button always renders).

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
        data-locale="<bcp47>"                          OPTIONAL (widget UI language; default = browser)
        data-wc-project-id="<projectId>"               OPTIONAL (defaults to xchtip.app's, build-injected)
        data-target="<css selector>"                   OPTIONAL (mount container; default: inline)
        async></script>
```

Attribute semantics:

- `data-recipient` (REQUIRED) — the recipient bech32m address (§3). Missing/invalid → the widget
  renders an inert, honest error in place of the button (never a tip to nowhere).
- `data-asset` (REQUIRED) — `xch` or a 64-hex CAT id (§2). Missing/invalid → inert error.
- `data-scheme` — `green` (default) or `purple`. Any other value → `green`.
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
  auto-detection; XCH is always `XCH`, the canonical DIG tail is `$DIG`, other CATs default to `CAT`.
- `data-locale` — the widget UI language (a BCP-47 tag). Default: the visitor's browser language,
  resolved to one of the 14 supported locales (en, zh-CN, zh-TW, ko, ja, ru, es, pt-BR, fr, de, tr,
  vi, id, hi) with per-string English fallback. The tip page passes its active locale through.
- **Brand glyph:** the button's leading glyph is chosen from the asset/scheme — a Chia leaf for XCH,
  the DIG mark for the $DIG CAT, and a heart for a custom-color scheme or any other CAT.
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
| `scheme`    | `green` \| `purple` \| a 6-hex color (treated as custom)                  |
| `color`     | a 6-hex custom accent; overrides `scheme`                                |
| `presets`   | comma-separated amounts                                                  |
| `label`     | custom button label                                                     |
| `variant`   | `button`\|`compact`\|`pill`\|`inline`\|`banner`\|`card` (default `button`)        |
| `symbol`    | CAT display symbol override (e.g. `DIG`)                                 |
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
the page is 100% reconstructable from the link alone (served via the CloudFront SPA fallback — a deep
link to `/jar/…` returns `index.html`, which reads the path).

Canonical URL form — parameters appear in this FIXED order, and defaults are OMITTED so equivalent
configs always mint the identical URL:

```
/jar/<recipient>                 recipient bech32m xch address (path segment; canonical lowercase)
  ?asset=<64-hex CAT id>         only when the asset is a CAT (omitted for XCH)
  &scheme=purple                 only for the purple scheme (green is the default)
  &color=%23rrggbb               only for a custom accent (implies the custom scheme)
  &presets=<a,b,c>               only when custom amount presets are set
  &label=<text>                  only when a custom button label is set
  &name=<text>                   only when a display name for the page is set
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
- The fee is DISCLOSED to the tipper: the tip modal shows a subtle "Includes a 0.1% network fee to
  xchtip.app" line, and the builder + jar page carry the same disclosure.

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
The CloudFront distribution is dualstack (A + AAAA), `http2and3`, `PriceClass_All`. See
`runbooks/deploy.md`.

## 12. Accessibility + machine-friendliness

The site MUST meet WCAG 2.2 AA (semantic landmarks, skip link, labelled controls, keyboard
operability, visible focus, sufficient contrast, `axe` 0 violations desktop + mobile) and ship
`llms.txt`, `robots.txt`, `sitemap.xml`, and full SEO meta (title/description/canonical/OG/Twitter +
schema.org JSON-LD). Interactive elements expose stable `data-testid`s.

## 13. Internationalization (follow-up)

All user-facing copy is centralized in `src/lib/strings.ts` with stable keys. i18n (react-intl + the
ecosystem's standard locale set) is a planned follow-up; the centralization is the seam for it. Brand
and scheme literals ($DIG, XCH, `xch://`, hex colors) are preserved verbatim.
