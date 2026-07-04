// embedCsp.ts — the exact Content-Security-Policy directives an EMBEDDER'S site must ADD (merge
// into its existing policy, never replace it) so a dropped-in `<script src=".../xch-tip.js">`
// widget actually works. Single source of truth for BOTH the on-site help panel (CspHelp.tsx,
// rendered next to the embed snippet in BuilderPanel) and SPEC.md §8b — keep all three in sync.
//
// Host provenance (so a future change to the widget's own dependencies is caught — see
// embedCsp.test.ts for the drift guard on the hosts that ARE literal strings in the widget):
//   - https://xchtip.app        — the <script src> origin itself, and the fetch for the
//                                  self-hosted chia-wallet-sdk-wasm glue + binary the widget loads
//                                  from its own origin at click time (widgetAssetBase()/CHIA_VENDOR
//                                  in public/embed/xch-tip.js).
//   - https://esm.sh            — the pinned CDN the widget dynamically `import()`s
//                                  @walletconnect/sign-client + qrcode from at click time
//                                  (WC_CDN / QR_CDN in xch-tip.js) — inert until the visitor clicks.
//   - https://api.coinset.org   — the Chia mainnet REST endpoint the widget posts coin
//                                  lookups + the final broadcast to (the COINSET constant).
//   - 'wasm-unsafe-eval'        — the widget compiles + instantiates its self-hosted wasm by hand
//                                  (WebAssembly.compile/instantiate) to build + sign spends.
//   - 'unsafe-inline' (style)   — the widget injects its button/modal styling via an inline
//                                  <style> block plus inline style="" attributes — no external
//                                  stylesheet.
//   - WalletConnect relay/verify/pulse/explorer-api hosts — NOT literal strings in xch-tip.js;
//     they belong to the pinned @walletconnect/sign-client@2.19.0 package it imports from esm.sh.
//     Cross-verified against hub.dig.net's own production CSP (infra/modules/cloudfront-
//     distributions/main.tf), which embeds the SAME sign-client version for its own tip widget and
//     is live-deployed. Re-verify this list if the widget's pinned WC_CDN version ever changes.
//
// Deliberately EXCLUDED vs a naive superset: `media-src` (the widget plays no audio/video) and an
// `img-src` allowance for xchtip.app / dexie icon hosts (the widget's built-in marks are inline
// SVG/emoji — no <img> fetch to a fixed host). A custom `data-logo` image is embedder-supplied and
// out of scope for a general host list; see cspLogoNote in the message catalog for that case.
export const EMBED_CSP_DIRECTIVES = {
  scriptSrc: "script-src 'self' 'wasm-unsafe-eval' https://xchtip.app https://esm.sh;",
  styleSrc: "style-src 'self' 'unsafe-inline';",
  connectSrc:
    "connect-src 'self' https://xchtip.app https://esm.sh https://api.coinset.org " +
    "wss://relay.walletconnect.org wss://relay.walletconnect.com " +
    "https://verify.walletconnect.org https://verify.walletconnect.com " +
    "https://pulse.walletconnect.org https://explorer-api.walletconnect.com;",
  frameSrc: "frame-src https://verify.walletconnect.org https://verify.walletconnect.com;",
} as const;

/** The full copyable CSP block, one directive per line, in the order an embedder should add them. */
export const EMBED_CSP = [
  EMBED_CSP_DIRECTIVES.scriptSrc,
  EMBED_CSP_DIRECTIVES.styleSrc,
  EMBED_CSP_DIRECTIVES.connectSrc,
  EMBED_CSP_DIRECTIVES.frameSrc,
].join("\n");
