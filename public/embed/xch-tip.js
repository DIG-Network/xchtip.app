/*!
 * xch-tip.js — the xchtip.app embeddable Chia TIP widget.
 * Stable URL: https://xchtip.app/embed/xch-tip.js
 *
 * Drop ONE <script> on ANY page to render a "Tip" button that lets a visitor tip a recipient
 * directly, wallet→wallet, in XCH or ANY CAT (including $DIG). It is FULLY SELF-CONTAINED: it does
 * NOT depend on any app bundle, the page's framework, or any global. On click it opens its OWN
 * WalletConnect modal (its own WalletConnect session — QR + copy-link, works best with a Chia wallet
 * such as Sage), then a tipping modal (pick/enter an amount → sign → send). The recipient is baked
 * into the embed (data-recipient); the spend is built client-side, signed by the visitor's wallet,
 * and broadcast to Chia mainnet.
 *
 *   <script
 *     src="https://xchtip.app/embed/xch-tip.js"
 *     data-recipient="xch1…"                (REQUIRED: the recipient bech32m Chia address)
 *     data-asset="xch"                       (REQUIRED: "xch" OR a 64-hex CAT asset id)
 *     data-scheme="green"                    (optional: green | purple; default green)
 *     data-color="#7a3dff"                   (optional: a custom 6-hex accent — overrides scheme)
 *     data-label="Tip"                       (optional button label)
 *     data-amount-presets="1,5,25"           (optional preset amounts, whole units of the asset)
 *     data-align="center"                    (optional: center|left|right; default center)
 *     data-size="md"                         (optional: md|lg; lg = a prominent tip-page button)
 *     data-variant="button"                  (optional: button|compact|card; the widget style)
 *     data-symbol="DIG"                      (optional: display symbol for a CAT; overrides auto)
 *     data-wc-project-id="<your projectId>"  (optional — defaults to xchtip.app's)
 *     data-target="#my-container"            (optional CSS selector to mount into; default: inline)
 *     async></script>
 *
 * PROVENANCE: this widget is a GENERALIZED port of the proven hub.dig.net tip widget
 * (public/embed/dig-tip.js). That widget solved self-hosted wasm loading (esm.sh's wrapper drops
 * __wbg_set_wasm, so the wasm-bindgen glue + _bg.wasm are SELF-HOSTED and instantiated by hand),
 * WalletConnect→Sage connect with session reuse, all config baked into the embed via data-attributes
 * (no runtime ping home), centered-in-parent layout, and the DIG-CAT ring spend. Here the payment leg
 * is generalized: XCH = a plain standard spend; a CAT = a CAT ring spend to the recipient for that
 * asset id (the $DIG path from the hub widget, generalized to any asset id).
 *
 * The wallet connect prompt shows the xchtip.app brand. An approved wallet session is reused across
 * page loads on the SAME site (WalletConnect persists it to this origin's localStorage). Cross-DOMAIN
 * reuse is not possible: browsers partition third-party storage per top-level site.
 */
(function () {
  "use strict";

  var GLOBAL = (window.__xchTip = window.__xchTip || { booted: false, wc: null, chia: null, styled: false });

  // Pinned CDN module specifiers (loaded at click time so the widget is inert until used).
  var WC_CDN = "https://esm.sh/@walletconnect/sign-client@2.19.0";
  var QR_CDN = "https://esm.sh/qrcode@1.5.4";

  // chia-wallet-sdk-wasm is a wasm-bindgen BUNDLER-target build with no runtime init; esm.sh's wrapper
  // does not reliably re-export __wbg_set_wasm. We SELF-HOST the glue + wasm on the SAME ORIGIN this
  // widget was served from and do the bundler step by hand in loadChia() (fetch wasm → instantiate
  // against the glue's imports → __wbg_set_wasm). Files copied verbatim from
  // node_modules/chia-wallet-sdk-wasm/ into public/embed/vendor/ (Vite copies public/ into dist/).
  var CHIA_VENDOR = "/embed/vendor";
  var CHIA_GLUE_FILE = "chia_wallet_sdk_wasm_bg.js";
  var CHIA_WASM_FILE = "chia_wallet_sdk_wasm_bg.wasm";

  var CHAIN = "chia:mainnet";
  var COINSET = "https://api.coinset.org";
  var XCH_MOJOS_PER_XCH = 1000000000000; // 1 XCH = 1e12 mojos
  var CAT_BASE_UNITS = 1000; // CATs in the ecosystem use 3 decimals (1 unit = 1000 base units)

  // The WC method set the widget needs (a subset of the CHIP-0002/chia set).
  var WC_METHODS = ["chia_getAddress", "chip0002_getAssetCoins", "chip0002_signCoinSpends"];

  var SAGE_WALLET_URL = "https://sagewallet.net/";

  // Default WalletConnect (Reown) projectId — xchtip.app's own, so a drop-in embed works with NO
  // data-wc-project-id. The placeholder is substituted in the DEPLOYED asset by
  // scripts/inject-embed-config.mjs at build time; NEVER the real id in committed source.
  var DEFAULT_WC_PROJECT_ID = "__XCHTIP_WC_PROJECT_ID__";
  function defaultProjectId() {
    return DEFAULT_WC_PROJECT_ID && DEFAULT_WC_PROJECT_ID.indexOf("__") !== 0 ? DEFAULT_WC_PROJECT_ID : "";
  }

  // ── Named schemes (byte-compatible with src/lib/schemes.ts). ────────────────────────────────────
  var SCHEMES = {
    green: { from: "#3ab54a", to: "#1f8f3a", text: "#ffffff", shadow: "rgba(31,143,58,.34)" },
    purple: { from: "#7a3dff", to: "#ff00de", text: "#ffffff", shadow: "rgba(122,61,255,.34)" },
  };
  function normHex(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    var m = /^#?([0-9a-f]{6})$/.exec(s);
    return m ? "#" + m[1] : null;
  }
  function darken(hex, amt) {
    var n = normHex(hex);
    if (!n) return hex;
    var r = Math.round(parseInt(n.slice(1, 3), 16) * (1 - amt));
    var g = Math.round(parseInt(n.slice(3, 5), 16) * (1 - amt));
    var b = Math.round(parseInt(n.slice(5, 7), 16) * (1 - amt));
    var h = function (x) { return x.toString(16).padStart(2, "0"); };
    return "#" + h(r) + h(g) + h(b);
  }
  function rgbaFromHex(hex, a) {
    var n = normHex(hex);
    if (!n) return "rgba(0,0,0," + a + ")";
    return "rgba(" + parseInt(n.slice(1, 3), 16) + "," + parseInt(n.slice(3, 5), 16) + "," + parseInt(n.slice(5, 7), 16) + "," + a + ")";
  }
  function resolveScheme(schemeName, color) {
    var hex = normHex(color);
    if (hex) return { from: hex, to: darken(hex, 0.22), text: "#ffffff", shadow: rgbaFromHex(hex, 0.34) };
    if (schemeName === "purple") return SCHEMES.purple;
    return SCHEMES.green;
  }

  // ── Pure config/amount logic (mirrors src/lib/embed.ts). ────────────────────────────────────────
  function strip0x(h) { return String(h == null ? "" : h).replace(/^0x/i, "").toLowerCase(); }
  function isValidCatId(s) { return /^[0-9a-f]{64}$/i.test(strip0x(s)); }
  function parseAsset(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    if (s === "" || s === "xch") return s === "xch" ? { kind: "xch" } : null;
    var id = strip0x(s);
    return isValidCatId(id) ? { kind: "cat", assetId: id } : null;
  }
  function parseAmount(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (s === "") return null;
    var n = Number(s);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }
  function parsePresets(raw, isXch) {
    if (raw == null) return null;
    var out = [];
    String(raw).split(",").forEach(function (part) {
      var n = Number(part.trim());
      if (isFinite(n) && n > 0) out.push(n);
    });
    return out.length ? out : null;
  }
  function defaultPresets(asset) { return asset.kind === "xch" ? [0.1, 0.5, 1] : [1, 5, 25]; }
  // The canonical $DIG CAT tail (mirrors src/lib/constants.ts) — used to pick the DIG symbol + mark.
  var DIG_ASSET_ID = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";
  function isDigAsset(asset) { return asset.kind === "cat" && asset.assetId === DIG_ASSET_ID; }
  // The display symbol for an asset. A CAT uses the explicit override (data-symbol) if given, else
  // "$DIG" for the canonical DIG tail, else a neutral "CAT" (the builder can auto-detect + pass one in).
  function assetUnitLabel(asset, symbolOverride) {
    if (asset.kind === "xch") return "XCH";
    var s = String(symbolOverride == null ? "" : symbolOverride).trim();
    if (s) return s;
    if (isDigAsset(asset)) return "$DIG";
    return "CAT";
  }

  // ── Brand glyphs (inline, self-contained SVG; currentColor so they inherit the button text). ──────
  // XCH → a Chia leaf mark; $DIG → the DIG "D" mark; anything else → the heart. Tiny single-path SVGs
  // so the embed stays dependency-free and the glyph scales with the button.
  var GLYPH_HEART = '<span class="xt-heart" aria-hidden="true">♥</span>';
  function glyphChiaLeaf() {
    return '<svg class="xt-glyph" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="M12 2C7 6 4 10 4 14.5A7.5 7.5 0 0 0 11.5 22c.3 0 .5-.2.5-.5V12c0-.3.2-.5.5-.5s.5.2.5.5v9.5c0 .3.2.5.5.5A7.5 7.5 0 0 0 20 14.5C20 10 17 6 12 2z"/></svg>';
  }
  function glyphDig() {
    return '<svg class="xt-glyph" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="M5 4h6a8 8 0 0 1 0 16H5V4zm3.2 3.1v9.8H11a4.9 4.9 0 0 0 0-9.8H8.2z"/></svg>';
  }
  // Choose the leading glyph for a config: Chia leaf for XCH, DIG mark for the DIG CAT, else heart.
  // A custom color scheme always uses the heart (it's a personal accent, not a brand asset).
  function glyphFor(asset, scheme) {
    if (scheme === "custom") return GLYPH_HEART;
    if (asset.kind === "xch") return glyphChiaLeaf();
    if (isDigAsset(asset)) return glyphDig();
    return GLYPH_HEART;
  }
  function amountToBaseUnits(asset, amount) {
    if (asset.kind === "xch") return Math.round(Number(amount) * XCH_MOJOS_PER_XCH);
    return Math.round(Number(amount) * CAT_BASE_UNITS);
  }
  function defaultLabel(asset, symbolOverride) {
    if (asset.kind === "xch") return "Tip in XCH";
    if (isDigAsset(asset)) return "Tip in DIG";
    var s = String(symbolOverride == null ? "" : symbolOverride).trim();
    if (s) return "Tip in " + s;
    return "Send a tip";
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseAlign(raw) {
    var v = String(raw == null ? "" : raw).trim().toLowerCase();
    return v === "left" || v === "right" ? v : "center";
  }
  // Button size: "lg" for a dedicated tip PAGE (bigger button); default "md" everywhere else.
  function parseSize(raw) {
    return String(raw == null ? "" : raw).trim().toLowerCase() === "lg" ? "lg" : "md";
  }
  // Widget style variant: "button" (default), "compact" (smaller inline pill), or "card" (a full
  // tip card with the recipient + inline amount chips). Any other value → "button".
  function parseVariant(raw) {
    var v = String(raw == null ? "" : raw).trim().toLowerCase();
    return v === "compact" || v === "card" ? v : "button";
  }

  // decode a bech32m Chia address to its 32-byte puzzle hash hex (mirrors src/lib/bech32m.ts). Returns
  // the puzzle-hash hex or null. The widget spends TO this puzzle hash.
  var BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  function bech32Polymod(values) {
    var GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    var chk = 1;
    for (var i = 0; i < values.length; i++) {
      var top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ values[i];
      for (var j = 0; j < 5; j++) if ((top >> j) & 1) chk ^= GEN[j];
    }
    return chk;
  }
  function bech32HrpExpand(hrp) {
    var out = [];
    for (var i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
    out.push(0);
    for (var k = 0; k < hrp.length; k++) out.push(hrp.charCodeAt(k) & 31);
    return out;
  }
  function bech32ConvertBits(data, from, to, pad) {
    var acc = 0, bits = 0, out = [], maxv = (1 << to) - 1;
    for (var i = 0; i < data.length; i++) {
      var value = data[i];
      if (value < 0 || value >> from !== 0) return null;
      acc = (acc << from) | value;
      bits += from;
      while (bits >= to) { bits -= to; out.push((acc >> bits) & maxv); }
    }
    if (pad) { if (bits > 0) out.push((acc << (to - bits)) & maxv); }
    else if (bits >= from || ((acc << (to - bits)) & maxv) !== 0) return null;
    return out;
  }
  function addressToPuzzleHash(addr) {
    var s = String(addr == null ? "" : addr);
    if (s !== s.toLowerCase() && s !== s.toUpperCase()) return null;
    var lower = s.toLowerCase();
    var sep = lower.lastIndexOf("1");
    if (sep < 1 || sep + 7 > lower.length) return null;
    var hrp = lower.slice(0, sep);
    if (hrp !== "xch" && hrp !== "txch") return null;
    var data = [];
    for (var i = sep + 1; i < lower.length; i++) {
      var idx = BECH32_CHARSET.indexOf(lower[i]);
      if (idx === -1) return null;
      data.push(idx);
    }
    if (bech32Polymod(bech32HrpExpand(hrp).concat(data)) !== 0x2bc830a3) return null;
    var payload = bech32ConvertBits(data.slice(0, data.length - 6), 5, 8, false);
    if (!payload || payload.length !== 32) return null;
    var hex = "";
    for (var b = 0; b < payload.length; b++) hex += payload[b].toString(16).padStart(2, "0");
    return hex;
  }

  function parseConfig(a) {
    a = a || {};
    var recipientPh = addressToPuzzleHash(a.recipient);
    if (!recipientPh) {
      return { ok: false, reason: 'The tip widget needs a valid Chia address (data-recipient="xch1…").' };
    }
    var asset = parseAsset(a.asset);
    if (!asset) {
      return { ok: false, reason: 'The tip widget needs data-asset="xch" or a 64-hex CAT asset id.' };
    }
    var color = normHex(a.color);
    // A custom accent color takes precedence and means the "custom" scheme (heart glyph, no brand).
    var scheme = color ? "custom" : (a.scheme === "purple" ? "purple" : "green");
    var symbol = String(a.symbol == null ? "" : a.symbol).trim();
    return {
      ok: true,
      recipientPh: recipientPh,
      recipientAddress: String(a.recipient).trim(),
      asset: asset,
      scheme: scheme,
      color: color,
      symbol: symbol || null,
      presets: parsePresets(a.presets, asset.kind === "xch") || defaultPresets(asset),
      label: (a.label && String(a.label).trim()) || defaultLabel(asset, symbol),
      align: parseAlign(a.align),
      size: parseSize(a.size),
      variant: parseVariant(a.variant),
    };
  }

  // ── Styles (injected once, namespaced .xt-*). ───────────────────────────────────────────────────
  function injectStyles(scheme) {
    if (GLOBAL.styled) return;
    GLOBAL.styled = true;
    var css = [
      ".xt-wrap{display:block;max-width:100%;text-align:center}",
      ".xt-wrap.xt-align-left{text-align:left}.xt-wrap.xt-align-right{text-align:right}",
      ".xt-btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;width:auto;max-width:100%;",
      "margin:5px;white-space:nowrap;vertical-align:middle;cursor:pointer;padding:10px 20px;border-radius:999px;",
      "font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#fff;",
      "transition:transform .12s ease,box-shadow .12s ease}",
      ".xt-btn:hover{transform:translateY(-1px)}",
      ".xt-btn:focus-visible{outline:2px solid #000;outline-offset:2px}",
      /* data-size=lg: a prominent button for a dedicated tip PAGE (additive; default size unchanged). */
      ".xt-btn.xt-lg{gap:11px;padding:15px 30px;font-size:17px}",
      ".xt-btn.xt-lg .xt-heart,.xt-btn.xt-lg .xt-glyph{font-size:17px}",
      /* data-variant=compact: a smaller inline pill. */
      ".xt-btn.xt-compact{gap:6px;padding:7px 14px;font-size:13px}",
      ".xt-btn.xt-compact .xt-heart,.xt-btn.xt-compact .xt-glyph{font-size:13px}",
      ".xt-heart{font-size:15px;line-height:1}",
      ".xt-glyph{display:inline-block;width:1em;height:1em;line-height:1;flex:0 0 auto;vertical-align:-.125em}",
      ".xt-btn-label{display:inline-block}",
      /* data-variant=card: a self-contained tip card wrapping the button. */
      ".xt-card{display:inline-block;box-sizing:border-box;position:relative;overflow:hidden;text-align:center;",
      "max-width:320px;width:100%;padding:22px 22px 20px;border-radius:16px;background:#12241f;color:#eef4f0;",
      "border:1px solid #1e3630;box-shadow:0 18px 50px rgba(0,0,0,.4);",
      "font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".xt-card-bar{position:absolute;top:0;left:0;right:0;height:4px}",
      ".xt-card-eyebrow{margin:2px 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--xt-accent,#57e39a)}",
      ".xt-card-title{margin:0 0 8px;font-size:18px;font-weight:700;color:#fff}",
      ".xt-card-addr{margin:0 auto 16px;font-family:ui-monospace,'JetBrains Mono',Menlo,Consolas,monospace;font-size:12px;color:#a6bcb3;word-break:break-all}",
      ".xt-card .xt-btn{margin:0}",
      ".xt-card-note{margin:14px 0 0;font-size:11.5px;line-height:1.5;color:#6f8880}",
      ".xt-scrim{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;",
      "background:rgba(11,10,18,.62);backdrop-filter:blur(3px);padding:20px;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}",
      ".xt-modal{position:relative;width:100%;max-width:380px;box-sizing:border-box;background:#fff;color:#1a1430;",
      "border-radius:18px;padding:26px 24px 24px;box-shadow:0 30px 70px rgba(0,0,0,.45);overflow:hidden}",
      ".xt-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}",
      ".xt-close{position:absolute;top:14px;right:16px;all:unset;cursor:pointer;font-size:22px;line-height:1;color:#9a93ad}",
      ".xt-close:hover{color:#1a1430}",
      ".xt-mark{font-size:13px;font-weight:700;letter-spacing:.04em}",
      ".xt-title{margin:6px 0 2px;font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px}",
      ".xt-sub{margin:0 0 18px;font-size:13.5px;line-height:1.5;color:#6b6580}",
      ".xt-amounts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}",
      ".xt-amount{all:unset;box-sizing:border-box;cursor:pointer;flex:1 1 auto;min-width:64px;text-align:center;",
      "padding:11px 8px;border-radius:11px;border:1.5px solid #e6e1f2;font-size:14px;font-weight:600;color:#3a3450;transition:border-color .14s,background .14s,color .14s}",
      ".xt-amount:hover{border-color:#c9bdf0}",
      ".xt-custom-row{display:flex;align-items:center;gap:8px;margin-bottom:14px}",
      ".xt-input{flex:1;box-sizing:border-box;padding:11px 12px;border-radius:11px;border:1.5px solid #e6e1f2;font:inherit;font-size:15px;color:#1a1430}",
      ".xt-input:focus{outline:none}",
      ".xt-unit{font-size:13px;font-weight:600;color:#6b6580}",
      ".xt-actions{display:flex;gap:10px;margin-top:8px}",
      ".xt-action{all:unset;box-sizing:border-box;cursor:pointer;text-align:center;flex:1;padding:12px;border-radius:12px;font-size:14px;font-weight:600;transition:opacity .14s}",
      ".xt-action[disabled]{opacity:.5;cursor:not-allowed}",
      ".xt-secondary{border:1.5px solid #e6e1f2;color:#3a3450}",
      ".xt-note{margin:14px 0 0;font-size:12px;color:#9a93ad;text-align:center;line-height:1.5}",
      ".xt-note a{text-decoration:none}",
      ".xt-qr{display:flex;flex-direction:column;align-items:center;gap:14px;padding:6px 0 2px}",
      ".xt-qr canvas{width:200px;height:200px;border-radius:12px;background:#fff;border:1px solid #eee}",
      ".xt-copy{all:unset;box-sizing:border-box;cursor:pointer;padding:9px 16px;border-radius:10px;border:1.5px solid #e6e1f2;font-size:13px;font-weight:600;color:#3a3450}",
      ".xt-spinner{width:38px;height:38px;border-radius:50%;border:3px solid rgba(0,0,0,.14);animation:xt-spin .9s linear infinite;margin:8px auto}",
      "@keyframes xt-spin{to{transform:rotate(360deg)}}",
      ".xt-center{text-align:center;padding:6px 0}",
      ".xt-err{color:#c0264a;font-size:13.5px;line-height:1.5;margin:6px 0 14px}",
      ".xt-done-heart{font-size:42px;display:block;text-align:center;margin:6px 0 4px}",
      "@media (prefers-reduced-motion:reduce){.xt-spinner{animation:none}}",
    ].join("");
    var style = document.createElement("style");
    style.id = "xt-styles";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ── CDN loaders (memoised). ─────────────────────────────────────────────────────────────────────
  function loadWalletConnect() {
    if (!GLOBAL.wc) {
      GLOBAL.wc = import(/* @vite-ignore */ WC_CDN)
        .then(function (m) { return m.default || m.SignClient || m; })
        .catch(function () { GLOBAL.wc = null; throw new Error("Could not load the wallet connector. Check your connection."); });
    }
    return GLOBAL.wc;
  }
  function widgetAssetBase() {
    if (GLOBAL.assetBase != null) return GLOBAL.assetBase;
    var origin = "";
    try { var el = selfScript(); if (el && el.src) origin = new URL(el.src).origin; } catch (_) {}
    GLOBAL.assetBase = origin;
    return origin;
  }
  function chiaVendorBase() { return widgetAssetBase() + CHIA_VENDOR; }

  // Manually perform the wasm-bindgen bundler step for the SELF-HOSTED chia-wallet-sdk-wasm build.
  function loadChia() {
    if (!GLOBAL.chia) {
      GLOBAL.chia = (async function () {
        var base = chiaVendorBase();
        var glueUrl = base + "/" + CHIA_GLUE_FILE;
        var wasmUrl = base + "/" + CHIA_WASM_FILE;
        var glue;
        try { glue = await import(/* @vite-ignore */ glueUrl); }
        catch (e) { throw new Error("Could not load the payment engine (glue module): " + ((e && e.message) || e)); }
        if (typeof glue.__wbg_set_wasm !== "function") {
          throw new Error("Could not load the payment engine: the wasm glue is missing __wbg_set_wasm.");
        }
        var buf;
        try {
          var res = await fetch(wasmUrl);
          if (!res.ok) throw new Error("HTTP " + res.status);
          buf = await res.arrayBuffer();
        } catch (e) { throw new Error("Could not load the payment engine (wasm binary): " + ((e && e.message) || e)); }
        var instance;
        try {
          var module = await WebAssembly.compile(buf);
          var imports = {};
          var descs = WebAssembly.Module.imports(module);
          for (var i = 0; i < descs.length; i++) imports[descs[i].module] = glue;
          var result = await WebAssembly.instantiate(module, imports);
          instance = result.instance || result;
        } catch (e) { throw new Error("Could not load the payment engine (wasm instantiate): " + ((e && e.message) || e)); }
        glue.__wbg_set_wasm(instance.exports);
        if (typeof instance.exports.__wbindgen_start === "function") instance.exports.__wbindgen_start();
        return glue;
      })().catch(function (e) { GLOBAL.chia = null; throw e instanceof Error ? e : new Error("Could not load the payment engine: " + e); });
    }
    return GLOBAL.chia;
  }

  // ── WalletConnect — the widget's OWN session. ──────────────────────────────────────────────────
  function makeWallet(projectId, assetBase) {
    var client = null;
    var topic = null;
    async function getClient() {
      if (client) return client;
      var SignClient = await loadWalletConnect();
      client = await SignClient.init({
        projectId: projectId,
        customStoragePrefix: "xch-tip",
        metadata: {
          name: "xchtip.app Tip",
          description: "Tip this recipient on Chia.",
          url: assetBase,
          icons: [assetBase + "/favicon.svg"],
        },
      });
      return client;
    }
    async function restore() {
      try {
        var c = await getClient();
        var sessions = c.session && typeof c.session.getAll === "function" ? c.session.getAll() : [];
        var now = Math.floor(Date.now() / 1000);
        for (var i = sessions.length - 1; i >= 0; i--) {
          var s = sessions[i];
          if (s && s.topic && s.namespaces && s.namespaces.chia && (!s.expiry || s.expiry > now + 30)) { topic = s.topic; return s; }
        }
      } catch (_) {}
      return null;
    }
    async function connect() {
      var c = await getClient();
      var res = await c.connect({ optionalNamespaces: { chia: { methods: WC_METHODS, chains: [CHAIN], events: [] } } });
      return {
        uri: res.uri,
        approval: async function () { var session = await res.approval(); topic = session.topic; return session; },
      };
    }
    async function request(method, params) {
      var c = await getClient();
      var t;
      var timeout = new Promise(function (_, rej) { t = setTimeout(function () { rej(new Error("Your wallet didn't respond — open your wallet app and try again.")); }, 60000); });
      try {
        return await Promise.race([c.request({ topic: topic, chainId: CHAIN, request: { method: method, params: params } }), timeout]);
      } finally { clearTimeout(t); }
    }
    return { connect: connect, restore: restore, request: request, getTopic: function () { return topic; } };
  }

  // ── Spend helpers (chia from wasm, coins via WC, parents/broadcast via coinset). ─────────────────
  function bytesToHex(bytes) { var out = ""; for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0"); return out; }
  function hex0xToBytes(h) { var s = strip0x(h); var out = new Uint8Array(s.length / 2); for (var i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16); return out; }
  async function coinsetPost(path, body) {
    var res = await fetch(COINSET + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json().catch(function () { return {}; });
  }
  function fix0x(h) { return h && !String(h).startsWith("0x") ? "0x" + h : h; }
  function coinSpendToWallet(cs) {
    return {
      coin: {
        parent_coin_info: cs.coin.parent_coin_info != null ? cs.coin.parent_coin_info : cs.coin.parentCoinInfo,
        puzzle_hash: cs.coin.puzzle_hash != null ? cs.coin.puzzle_hash : cs.coin.puzzleHash,
        amount: cs.coin.amount,
      },
      puzzle_reveal: cs.puzzle_reveal != null ? cs.puzzle_reveal : cs.puzzleReveal,
      solution: cs.solution,
    };
  }

  // Read the sender's synthetic public key + inner puzzle hash from a standard-puzzle reveal (shared
  // by the XCH + CAT paths). The wallet's coins are p2_delegated_puzzle_or_hidden_puzzle (the Chia
  // "standard" puzzle) curried with ONE argument: the 48-byte synthetic public key. We recover it by
  // uncurrying the reveal and reading that first curried argument as an atom — the only API the
  // vendored chia-wallet-sdk-wasm actually exposes (there is no puzzle.parseStandard* helper).
  function readSenderKey(chia, clvm, puzzleRevealHex) {
    var syntheticPkBytes = recoverSyntheticPk(chia, clvm, puzzleRevealHex);
    if (!syntheticPkBytes || syntheticPkBytes.length !== 48) {
      throw new Error("Could not read your wallet's signing key from its coins.");
    }
    var pk = chia.PublicKey.fromBytes(syntheticPkBytes);
    var innerPhBytes = chia.standardPuzzleHash ? chia.standardPuzzleHash(pk) : clvm.standardPuzzle(pk).puzzleHash();
    return { pk: pk, innerPh: strip0x(chia.toHex(innerPhBytes)) };
  }

  // Recover the 48-byte synthetic pk (Uint8Array) from a standard-puzzle reveal by uncurrying. Tries
  // the CurriedProgram.args accessor first (getter or method), then falls back to toArgList() on the
  // uncurried program's rest — tolerant of minor wasm-binding shape differences across versions.
  function recoverSyntheticPk(chia, clvm, puzzleRevealHex) {
    var prog = clvm.deserialize(chia.fromHex(strip0x(puzzleRevealHex)));
    var curried = prog.uncurry ? prog.uncurry() : null;
    if (!curried) return null;
    var args = null;
    try { args = typeof curried.args === "function" ? curried.args() : curried.args; } catch (_) { args = null; }
    if ((!args || !args.length) && curried.getArgs) { try { args = curried.getArgs(); } catch (_) {} }
    if (!args || !args.length) return null;
    var first = args[0];
    if (!first) return null;
    // The synthetic pk is the first curried argument, an atom of 48 bytes.
    if (typeof first.toAtom === "function") { try { return first.toAtom(); } catch (_) {} }
    if (typeof first.toBytes === "function") { try { return first.toBytes(); } catch (_) {} }
    return null;
  }

  // Build unsigned XCH coin spends sending `mojos` to `recipientPh`. Returns { coin_spends }.
  async function buildXchPayment(wallet, recipientPh, mojos) {
    var chia = await loadChia();
    var clvm = new chia.Clvm();
    var need = BigInt(mojos);
    var recipient = strip0x(recipientPh);

    var entries = (await wallet.request("chip0002_getAssetCoins", { type: null, assetId: null, includedLocked: false, offset: 0, limit: 200 })) || [];
    var coins = Array.isArray(entries) ? entries : (entries.coins || []);
    if (!coins.length) throw new Error("Your wallet holds no XCH. Add XCH and try again.");

    function puzzleRevealOf(e) { return (e && (e.puzzle || e.puzzleReveal || e.puzzle_reveal)) || null; }
    var lead = null;
    for (var k = 0; k < coins.length; k++) { if (puzzleRevealOf(coins[k])) { lead = coins[k]; break; } }
    if (!lead) throw new Error("Your wallet didn't return spendable XCH coins. Reconnect and try again.");
    var sender = readSenderKey(chia, clvm, puzzleRevealOf(lead));
    var senderPhBytes = chia.fromHex(sender.innerPh);
    var senderPh = sender.innerPh;

    var owned = coins.filter(function (e) {
      var ph = strip0x((e.coin && (e.coin.puzzle_hash || e.coin.puzzleHash)) || "");
      if (ph !== senderPh) return false;
      if (((e.spent_block_index != null ? e.spent_block_index : e.spentBlockIndex) || 0) !== 0 || e.locked) return false;
      return true;
    });
    owned.sort(function (a, b) { return (BigInt(b.coin.amount) - BigInt(a.coin.amount) > 0n ? 1 : -1); });

    var selected = [];
    var sum = 0n;
    for (var i = 0; i < owned.length && sum < need; i++) { selected.push(owned[i]); sum += BigInt(owned[i].coin.amount); }
    if (sum < need) throw new Error("Not enough XCH: need " + (Number(need) / XCH_MOJOS_PER_XCH) + " XCH, have " + (Number(sum) / XCH_MOJOS_PER_XCH) + " XCH.");
    var change = sum - need;

    for (var j = 0; j < selected.length; j++) {
      var e = selected[j];
      var coin = new chia.Coin(
        hex0xToBytes(e.coin.parent_coin_info != null ? e.coin.parent_coin_info : e.coin.parentCoinInfo),
        hex0xToBytes(e.coin.puzzle_hash != null ? e.coin.puzzle_hash : e.coin.puzzleHash),
        BigInt(e.coin.amount)
      );
      var conditions = [];
      if (j === 0) {
        conditions.push(clvm.createCoin(chia.fromHex(recipient), need, clvm.nil()));
        if (change > 0n) conditions.push(clvm.createCoin(senderPhBytes, change, clvm.nil()));
      }
      var delegated = clvm.delegatedSpend(conditions);
      clvm.spendStandardCoin(coin, sender.pk, delegated);
    }
    var wasmCoinSpends = clvm.coinSpends();
    return { coin_spends: wasmCoinSpends.map(coinSpendToWallet) };
  }

  // Build unsigned CAT coin spends sending `baseUnits` of `assetId` to `recipientPh`. Faithful port of
  // the hub dig-tip.js DIG-CAT ring spend, generalized to any asset id. Returns { coin_spends }.
  async function buildCatPayment(wallet, assetId, recipientPh, baseUnits) {
    var chia = await loadChia();
    var clvm = new chia.Clvm();
    var need = BigInt(baseUnits);
    var recipient = strip0x(recipientPh);
    var assetIdBytes = chia.fromHex(strip0x(assetId));

    var entries = (await wallet.request("chip0002_getAssetCoins", { type: "cat", assetId: strip0x(assetId), includedLocked: false, offset: 0, limit: 200 })) || [];
    var coins = Array.isArray(entries) ? entries : (entries.coins || []);
    if (!coins.length) throw new Error("Your wallet holds none of that token. Add it and try again.");

    function puzzleRevealOf(e) { return (e && (e.puzzle || e.puzzleReveal || e.puzzle_reveal)) || null; }
    var lead = null;
    for (var k = 0; k < coins.length; k++) { if (puzzleRevealOf(coins[k])) { lead = coins[k]; break; } }
    if (!lead) throw new Error("Your wallet didn't return spendable coins. Reconnect and try again.");
    var sender = readSenderKey(chia, clvm, puzzleRevealOf(lead));

    var senderCatPhBytes = chia.catPuzzleHash(assetIdBytes, chia.fromHex(sender.innerPh));
    var senderCatPh = strip0x(chia.toHex(senderCatPhBytes));
    var owned = coins.filter(function (e) {
      var ph = strip0x((e.coin && (e.coin.puzzle_hash || e.coin.puzzleHash)) || "");
      if (ph !== senderCatPh) return false;
      if (((e.spent_block_index != null ? e.spent_block_index : e.spentBlockIndex) || 0) !== 0 || e.locked) return false;
      return true;
    });
    owned.sort(function (a, b) { return (BigInt(b.coin.amount) - BigInt(a.coin.amount) > 0n ? 1 : -1); });

    var selected = [];
    var sum = 0n;
    for (var i = 0; i < owned.length && sum < need; i++) { selected.push(owned[i]); sum += BigInt(owned[i].coin.amount); }
    if (sum < need) throw new Error("Not enough of that token: need " + (Number(need) / CAT_BASE_UNITS) + ", have " + (Number(sum) / CAT_BASE_UNITS) + ".");
    var change = sum - need;

    var catSpends = [];
    for (var j = 0; j < selected.length; j++) {
      var e = selected[j];
      var wasmChildCoin = new chia.Coin(
        hex0xToBytes(e.coin.parent_coin_info != null ? e.coin.parent_coin_info : e.coin.parentCoinInfo),
        hex0xToBytes(e.coin.puzzle_hash != null ? e.coin.puzzle_hash : e.coin.puzzleHash),
        BigInt(e.coin.amount)
      );
      var childIdHex = bytesToHex(wasmChildCoin.coinId());
      var recJson = await coinsetPost("/get_coin_record_by_name", { name: fix0x(childIdHex) });
      var rec = recJson.coin_record;
      var confirmedHeight = rec ? Number(rec.confirmed_block_index || 0) : 0;
      if (confirmedHeight <= 0) throw new Error("A coin isn't confirmed on-chain yet — try again shortly.");
      var parentIdHex = bytesToHex(wasmChildCoin.parentCoinInfo);
      var psJson = await coinsetPost("/get_puzzle_and_solution", { coin_id: fix0x(parentIdHex), height: confirmedHeight });
      var ps = psJson.coin_solution;
      if (!ps || !ps.coin) throw new Error("Could not fetch a parent spend for a coin.");

      var parentPuzzleBytes = chia.fromHex(strip0x(ps.puzzle_reveal || ps.puzzleReveal || ""));
      var parentProgram = clvm.deserialize(parentPuzzleBytes);
      var parsedParentCat = parentProgram.puzzle().parseCatInfo();
      var parentInnerPhBytes = (parsedParentCat && parsedParentCat.info && parsedParentCat.info.p2PuzzleHash)
        ? parsedParentCat.info.p2PuzzleHash : chia.fromHex(sender.innerPh);
      var parentCoin = new chia.Coin(
        hex0xToBytes(ps.coin.parent_coin_info != null ? ps.coin.parent_coin_info : ps.coin.parentCoinInfo),
        hex0xToBytes(ps.coin.puzzle_hash != null ? ps.coin.puzzle_hash : ps.coin.puzzleHash),
        BigInt(ps.coin.amount)
      );
      var lineageProof = new chia.LineageProof(parentCoin.parentCoinInfo, parentInnerPhBytes, parentCoin.amount);
      var catInfo = new chia.CatInfo(assetIdBytes, undefined, chia.fromHex(sender.innerPh));
      var cat = new chia.Cat(wasmChildCoin, lineageProof, catInfo);

      var conditions = [];
      if (j === 0) {
        var recipientPhBytes = chia.fromHex(recipient);
        var memoProgram = clvm.list([clvm.atom(recipientPhBytes)]);
        conditions.push(clvm.createCoin(recipientPhBytes, need, memoProgram));
        if (change > 0n) conditions.push(clvm.createCoin(chia.fromHex(sender.innerPh), change));
      }
      var delegated = clvm.delegatedSpend(conditions);
      var innerSpend = clvm.standardSpend(sender.pk, delegated);
      catSpends.push(new chia.CatSpend(cat, innerSpend));
    }
    clvm.spendCats(catSpends);
    return { coin_spends: clvm.coinSpends().map(coinSpendToWallet) };
  }

  async function buildPayment(wallet, cfg, amount) {
    var base = amountToBaseUnits(cfg.asset, amount);
    if (cfg.asset.kind === "xch") return buildXchPayment(wallet, cfg.recipientPh, base);
    return buildCatPayment(wallet, cfg.asset.assetId, cfg.recipientPh, base);
  }

  async function signAndSend(wallet, coin_spends) {
    var resp = await wallet.request("chip0002_signCoinSpends", { coinSpends: coin_spends, partialSign: true });
    var sig = typeof resp === "string" ? resp : (resp && (resp.signature || resp.aggregatedSignature || resp.aggregated_signature)) || "";
    if (!sig) throw new Error("Your wallet did not return a signature.");
    var body = {
      spend_bundle: {
        coin_spends: coin_spends.map(function (cs) {
          return {
            coin: { parent_coin_info: fix0x(cs.coin.parent_coin_info), puzzle_hash: fix0x(cs.coin.puzzle_hash), amount: cs.coin.amount },
            puzzle_reveal: fix0x(cs.puzzle_reveal),
            solution: fix0x(cs.solution),
          };
        }),
        aggregated_signature: String(sig).startsWith("0x") ? sig : "0x" + sig,
      },
    };
    var j = await coinsetPost("/push_tx", body);
    var status = j.status || "";
    var ok = j.success === true || status === "SUCCESS" || status === "PENDING";
    if (!ok || j.error) {
      if (/double[_ ]?spend/i.test(j.error || "")) throw new Error("Those coins are already pending. Try again — different coins will be used.");
      throw new Error(j.error || "The network did not accept the tip.");
    }
    return { ok: true };
  }

  // ── QR (drawn locally). ─────────────────────────────────────────────────────────────────────────
  function renderQrInto(slot, uri) {
    var canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 200;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "WalletConnect QR code");
    slot.appendChild(canvas);
    import(/* @vite-ignore */ QR_CDN)
      .then(function (m) {
        var QR = m.default || m;
        var toCanvas = QR.toCanvas || (QR.default && QR.default.toCanvas);
        if (typeof toCanvas === "function") toCanvas(canvas, uri, { width: 200, margin: 1, color: { dark: "#1a1430", light: "#ffffff" } }, function () {});
      })
      .catch(function () {});
  }

  // ── The widget — one instance per <script>. ─────────────────────────────────────────────────────
  function mountWidget(scriptEl, cfg, projectId) {
    var scheme = resolveScheme(cfg.scheme, cfg.color);
    injectStyles(scheme);
    var assetBase = widgetAssetBase() || "https://xchtip.app";
    var unit = assetUnitLabel(cfg.asset, cfg.symbol);
    var glyph = glyphFor(cfg.asset, cfg.scheme);

    var mountTarget = null;
    if (scriptEl.dataset.target) { try { mountTarget = document.querySelector(scriptEl.dataset.target); } catch (_) {} }

    // The trigger button — its class encodes size + variant so the CSS styles each variant. The
    // leading glyph is brand-aware (Chia leaf / DIG mark / heart). The card variant wraps the button
    // in a small card with the recipient + a one-line pitch (still opening the same tip flow on click).
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "xt-btn" + (cfg.size === "lg" ? " xt-lg" : "") + (cfg.variant === "compact" ? " xt-compact" : "");
    btn.setAttribute("aria-haspopup", "dialog");
    btn.style.background = "linear-gradient(135deg," + scheme.from + " 0%," + scheme.to + " 100%)";
    btn.style.color = scheme.text;
    btn.style.boxShadow = "0 6px 18px " + scheme.shadow;
    btn.innerHTML = glyph + '<span class="xt-btn-label">' + escapeHtml(cfg.label) + "</span>";

    var wrap = document.createElement("div");
    wrap.className = "xt-wrap" + (cfg.align === "left" ? " xt-align-left" : cfg.align === "right" ? " xt-align-right" : "");

    if (cfg.variant === "card") {
      var card = document.createElement("div");
      card.className = "xt-card";
      card.style.setProperty("--xt-accent", scheme.from);
      var shortAddr = cfg.recipientAddress.length > 16
        ? cfg.recipientAddress.slice(0, 8) + "…" + cfg.recipientAddress.slice(-7)
        : cfg.recipientAddress;
      card.innerHTML =
        '<div class="xt-card-bar" style="background:linear-gradient(90deg,' + scheme.from + "," + scheme.to + ')"></div>' +
        '<div class="xt-card-eyebrow">Tip in ' + escapeHtml(unit) + "</div>" +
        '<div class="xt-card-title">Support this creator</div>' +
        '<div class="xt-card-addr" title="' + escapeHtml(cfg.recipientAddress) + '">' + escapeHtml(shortAddr) + "</div>";
      card.appendChild(btn);
      card.insertAdjacentHTML("beforeend", '<div class="xt-card-note">On-chain, wallet to wallet. You keep 100%.</div>');
      wrap.appendChild(card);
    } else {
      wrap.appendChild(btn);
    }

    if (mountTarget) mountTarget.appendChild(wrap);
    else if (scriptEl.parentNode) scriptEl.parentNode.insertBefore(wrap, scriptEl.nextSibling);
    else document.body.appendChild(wrap);

    var wallet = null;
    var state = { status: "idle", topic: null, amount: cfg.presets[0] || 1, useCustom: false, prepared: null, error: null, uri: null, customAmount: "" };
    var scrim = null;

    function accentStyle() { return "color:#fff;background:linear-gradient(135deg," + scheme.from + "," + scheme.to + ");box-shadow:0 6px 16px " + scheme.shadow; }
    function currentAmount() { return state.useCustom ? (parseAmount(state.customAmount) || 0) : state.amount; }
    function amountLabel(n) { return n + " " + unit; }

    function close() {
      if (scrim && scrim.parentNode) scrim.parentNode.removeChild(scrim);
      scrim = null; state.status = "idle"; state.prepared = null; state.error = null; btn.focus();
    }

    function render() {
      if (!scrim) {
        scrim = document.createElement("div");
        scrim.className = "xt-scrim";
        scrim.setAttribute("role", "dialog");
        scrim.setAttribute("aria-modal", "true");
        scrim.setAttribute("aria-label", "Send a tip");
        scrim.addEventListener("click", function (e) { if (e.target === scrim && state.status !== "signing") close(); });
        document.body.appendChild(scrim);
      }
      var closeBtn = state.status === "signing" ? "" : '<button class="xt-close" data-act="close" aria-label="Close">×</button>';
      var header =
        '<div class="xt-mark" style="color:' + scheme.from + '">xchtip.app</div>' +
        '<div class="xt-title"><span class="xt-heart" aria-hidden="true" style="color:' + scheme.from + '">♥</span>Send a tip</div>';
      var body = "";

      if (state.status === "connecting" || state.status === "pairing") {
        if (state.uri) {
          body =
            '<p class="xt-sub">Scan with your Chia wallet to connect, then approve the tip. Works best with Sage.</p>' +
            '<div class="xt-qr"><div id="xt-qrslot"></div><button class="xt-copy" data-act="copy">Copy connection link</button></div>' +
            '<p class="xt-note">No wallet yet? <a href="' + SAGE_WALLET_URL + '" target="_blank" rel="noopener noreferrer" style="color:' + scheme.from + '">Get Sage ↗</a></p>';
        } else {
          body = '<div class="xt-center"><div class="xt-spinner" style="border-top-color:' + scheme.from + '"></div><p class="xt-sub">Opening your wallet connection…</p></div>';
        }
      } else if (state.status === "pick") {
        var chips = cfg.presets.map(function (d) {
          var pressed = !state.useCustom && state.amount === d;
          return '<button class="xt-amount" data-act="preset" data-amt="' + d + '" aria-pressed="' + pressed + '"' + (pressed ? ' style="border-color:' + scheme.from + ';background:' + rgbaFromHex(scheme.from, 0.08) + '"' : "") + ">" + amountLabel(d) + "</button>";
        }).join("");
        chips += '<button class="xt-amount" data-act="custom" aria-pressed="' + state.useCustom + '">Custom</button>';
        var customRow = state.useCustom
          ? '<div class="xt-custom-row"><input class="xt-input" type="number" min="0" step="any" placeholder="Enter amount" value="' + escapeHtml(state.customAmount) + '" data-act="custominput" aria-label="Custom amount" /><span class="xt-unit">' + unit + '</span></div>'
          : "";
        var amt = currentAmount();
        body =
          '<p class="xt-sub">Send ' + unit + ' straight to the recipient’s wallet — on-chain, no middleman.</p>' +
          '<div class="xt-amounts">' + chips + "</div>" + customRow +
          '<div class="xt-actions"><button class="xt-action xt-secondary" data-act="close">Cancel</button>' +
          '<button class="xt-action" style="' + accentStyle() + '" data-act="confirm"' + (amt > 0 ? "" : " disabled") + ">Send " + (amt > 0 ? amountLabel(amt) : unit) + " ♥</button></div>";
      } else if (state.status === "preparing") {
        body = '<div class="xt-center"><div class="xt-spinner" style="border-top-color:' + scheme.from + '"></div><p class="xt-sub">Preparing your ' + amountLabel(currentAmount()) + " tip…</p></div>";
      } else if (state.status === "sign") {
        body =
          '<p class="xt-sub">Approve the ' + amountLabel(currentAmount()) + " tip in your wallet. This sends directly to the recipient — wallet to wallet.</p>" +
          '<div class="xt-actions"><button class="xt-action xt-secondary" data-act="backtopick">Back</button>' +
          '<button class="xt-action" style="' + accentStyle() + '" data-act="sign">Sign &amp; send ♥</button></div>';
      } else if (state.status === "signing") {
        body = '<div class="xt-center"><div class="xt-spinner" style="border-top-color:' + scheme.from + '"></div><p class="xt-sub">Waiting for your wallet to sign…</p></div>';
      } else if (state.status === "done") {
        body =
          '<span class="xt-done-heart" aria-hidden="true" style="color:' + scheme.from + '">♥</span>' +
          '<p class="xt-sub" style="text-align:center">Tip sent! You sent <strong>' + amountLabel(currentAmount()) + "</strong> — broadcast to the Chia network.</p>" +
          '<div class="xt-actions"><button class="xt-action" style="' + accentStyle() + '" data-act="close">Done</button></div>';
      } else if (state.status === "error") {
        body =
          '<p class="xt-err" role="alert">' + escapeHtml(state.error || "Something went wrong.") + "</p>" +
          '<div class="xt-actions"><button class="xt-action xt-secondary" data-act="close">Close</button>' +
          '<button class="xt-action" style="' + accentStyle() + '" data-act="retry">Try again</button></div>';
      }

      scrim.innerHTML = '<div class="xt-modal"><span style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + scheme.from + "," + scheme.to + ')"></span>' + closeBtn + header + body + "</div>";
      if ((state.status === "connecting" || state.status === "pairing") && state.uri) {
        var slot = scrim.querySelector("#xt-qrslot");
        if (slot) renderQrInto(slot, state.uri);
      }
      wireActions();
    }

    function wireActions() {
      var els = scrim.querySelectorAll("[data-act]");
      for (var i = 0; i < els.length; i++) {
        (function (el) {
          var act = el.dataset.act;
          if (act === "custominput") { el.addEventListener("input", function () { state.customAmount = el.value; updateConfirm(); }); return; }
          el.addEventListener("click", function (ev) { ev.preventDefault(); onAction(act, el); });
        })(els[i]);
      }
    }
    function updateConfirm() {
      var confirm = scrim.querySelector('[data-act="confirm"]');
      if (!confirm) return;
      var amt = currentAmount();
      confirm.disabled = !(amt > 0);
      confirm.innerHTML = "Send " + (amt > 0 ? amountLabel(amt) : unit) + " ♥";
    }

    async function onAction(act, el) {
      if (act === "close") return close();
      if (act === "copy") { try { await navigator.clipboard.writeText(state.uri || ""); el.textContent = "Copied!"; setTimeout(function () { el.textContent = "Copy connection link"; }, 1500); } catch (_) {} return; }
      if (act === "preset") { state.useCustom = false; state.amount = Number(el.dataset.amt); render(); return; }
      if (act === "custom") { state.useCustom = true; render(); return; }
      if (act === "backtopick") { state.status = "pick"; state.prepared = null; render(); return; }
      if (act === "retry") { state.status = "pick"; state.error = null; state.prepared = null; render(); return; }
      if (act === "confirm") return doPrepare();
      if (act === "sign") return doSign();
    }

    async function doPrepare() {
      var amount = currentAmount();
      if (amount <= 0) return;
      state.amount = state.useCustom ? amount : state.amount;
      state.status = "preparing"; render();
      try {
        var built = await buildPayment(wallet, cfg, amount);
        state.prepared = built; state.status = "sign"; render();
      } catch (e) { state.status = "error"; state.error = (e && e.message) || "Could not prepare the tip."; render(); }
    }
    async function doSign() {
      state.status = "signing"; render();
      try { await signAndSend(wallet, state.prepared.coin_spends); state.status = "done"; render(); }
      catch (e) { state.status = "error"; state.error = (e && e.message) || "Signing or broadcast failed."; render(); }
    }

    async function open() {
      if (!projectId) {
        state.status = "error";
        state.error = "This tip button needs a WalletConnect projectId. Add data-wc-project-id to the embed snippet (free at cloud.reown.com).";
        render(); return;
      }
      if (state.topic && wallet) { state.status = "pick"; render(); return; }
      wallet = wallet || makeWallet(projectId, assetBase);
      try { var existing = await wallet.restore(); if (existing) { state.topic = existing.topic; state.status = "pick"; render(); return; } } catch (_) {}
      state.status = "connecting"; render();
      try {
        var pairing = await wallet.connect();
        state.uri = pairing.uri; render();
        var session = await pairing.approval();
        state.topic = session.topic; state.uri = null; state.status = "pick"; render();
      } catch (e) { state.status = "error"; state.error = (e && e.message) || "Could not connect your wallet."; render(); }
    }

    btn.addEventListener("click", open);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && scrim && state.status !== "signing") close(); });
  }

  // ── Boot. ───────────────────────────────────────────────────────────────────────────────────────
  function selfScript() {
    if (document.currentScript) return document.currentScript;
    var s = document.querySelectorAll('script[src*="xch-tip.js"]');
    return s.length ? s[s.length - 1] : null;
  }
  function boot() {
    var el = selfScript();
    if (!el) return;
    GLOBAL.loadChia = loadChia; // exposed for the wasm-init e2e
    var cfg = parseConfig({
      recipient: el.dataset.recipient,
      asset: el.dataset.asset,
      scheme: el.dataset.scheme,
      color: el.dataset.color,
      label: el.dataset.label,
      presets: el.dataset.amountPresets || el.dataset.presets,
      align: el.dataset.align,
      size: el.dataset.size,
      variant: el.dataset.variant,
      symbol: el.dataset.symbol,
    });
    if (!cfg.ok) {
      injectStyles();
      var note = document.createElement("span");
      note.className = "xt-note";
      note.textContent = cfg.reason;
      if (el.parentNode) el.parentNode.insertBefore(note, el.nextSibling);
      return;
    }
    mountWidget(el, cfg, el.dataset.wcProjectId || el.dataset.projectId || defaultProjectId());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
