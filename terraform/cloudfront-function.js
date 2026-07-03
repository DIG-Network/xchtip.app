// CloudFront Function (viewer-request) for xchtip.app, attached to the DEFAULT cache behavior only
// (/og, /jar/*, /assets/*, /embed/* are carved out to their own ordered_cache_behaviors in main.tf
// and never reach this function).
//
// Two responsibilities:
//   1. Serves GET /embed.txt?<builder params> as a real text/plain response computed at the edge —
//      the exact embed <script> snippet a caller would copy, so a tool/agent can `curl` it with no
//      JS and no scraping. Mirrors src/lib/embed.ts (the tested single source of truth); keep them
//      in agreement.
//   2. SPA-fallback rewrite: every real file the default behavior's S3 origin serves has a file
//      extension (index.html, favicon.svg, robots.txt, sitemap.xml, llms.txt, og.png, site.webmanifest,
//      icon-*.png — see public/). Any OTHER path (a client-side route, or a stale/typo'd deep link) is
//      rewritten HERE, at the edge, to /index.html so the SPA shell loads and React can take over —
//      BEFORE the request ever reaches S3. This replaces the old distribution-wide
//      `custom_error_response` (403/404 -> 200 /index.html): that mapping applied to the WHOLE
//      distribution regardless of which origin produced the error, so it also silently swallowed
//      genuine errors from the /og and /jar/* Lambda origins (an OAC/auth failure got masked as a
//      200 SPA page instead of surfacing as the real error). Doing the SPA rewrite proactively at the
//      edge means S3 (almost) never needs to 403, and only-real-file 403/404s (e.g. a truly missing
//      /favicon.ico) now correctly surface as errors instead of being masked.
//
// CloudFront Functions run a constrained JS runtime (ES5.1-ish) — this code stays within it (no
// let/const-only features assumed, no unsupported APIs).

var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function polymod(values) {
  var GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  var chk = 1;
  for (var i = 0; i < values.length; i++) {
    var top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[i];
    for (var j = 0; j < 5; j++) if ((top >> j) & 1) chk ^= GEN[j];
  }
  return chk;
}
function hrpExpand(hrp) {
  var out = [];
  for (var i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (var k = 0; k < hrp.length; k++) out.push(hrp.charCodeAt(k) & 31);
  return out;
}
function isChiaAddress(s) {
  if (!s) return false;
  var lower = s.toLowerCase();
  var upper = s.toUpperCase();
  if (s !== lower && s !== upper) return false;
  lower = s.toLowerCase();
  var sep = lower.lastIndexOf("1");
  if (sep < 1 || sep + 7 > lower.length) return false;
  var hrp = lower.substring(0, sep);
  if (hrp !== "xch" && hrp !== "txch") return false;
  var data = [];
  for (var i = sep + 1; i < lower.length; i++) {
    var idx = CHARSET.indexOf(lower.charAt(i));
    if (idx === -1) return false;
    data.push(idx);
  }
  var values = hrpExpand(hrp).concat(data);
  if (polymod(values) !== 0x2bc830a3) return false;
  // Payload (5-bit groups minus 6-char checksum) must convert to exactly 32 bytes.
  var dataLen = data.length - 6;
  var bytes = Math.floor((dataLen * 5) / 8);
  return bytes === 32;
}
function strip0x(h) {
  return String(h == null ? "" : h).replace(/^0x/i, "").toLowerCase();
}
function isCatId(v) {
  return /^[0-9a-f]{64}$/i.test(strip0x(v));
}
function isHex6(v) {
  return /^#?[0-9a-f]{6}$/i.test(String(v == null ? "" : v));
}
function normHex(v) {
  var s = String(v == null ? "" : v).toLowerCase();
  var m = /^#?([0-9a-f]{6})$/.exec(s);
  return m ? "#" + m[1] : null;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function qv(qs, key) {
  return qs[key] && qs[key].value != null ? qs[key].value : null;
}
// Sanitize a URL-sourced display name: collapse whitespace, strip control chars, cap at 64. Mirrors
// src/lib/embed.ts normalizeDisplayName (kept in agreement). Returns "" for an empty/nullish name.
function cleanName(v) {
  if (v == null) return "";
  return String(v)
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/^\s+|\s+$/g, "")
    .slice(0, 64);
}

var WIDGET_VARIANTS = ["button", "compact", "pill", "inline", "banner", "card"];
function normVariant(v) {
  var s = String(v == null ? "" : v).trim().toLowerCase();
  return WIDGET_VARIANTS.indexOf(s) >= 0 ? s : null;
}
// normalizeLogoUrl — mirrors src/lib/logo.ts: only https:// or data:image/*;base64, URLs are
// accepted; anything else (javascript:, http:, file:, blob:, …) is dropped silently (never a hard
// error — an invalid logo just isn't emitted, the widget falls back to its built-in mark).
var ALLOWED_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|gif|webp|svg\+xml)(;charset=[\w-]+)?;base64,/i;
function normalizeLogoUrl(v) {
  var s = String(v == null ? "" : v).trim();
  if (s === "") return null;
  if (/^https:\/\//i.test(s)) return s;
  if (ALLOWED_DATA_IMAGE_RE.test(s)) return s;
  return null;
}

function textResponse(status, body) {
  return {
    statusCode: status,
    statusDescription: status === 200 ? "OK" : "Bad Request",
    headers: {
      "content-type": { value: "text/plain; charset=utf-8" },
      "access-control-allow-origin": { value: "*" },
      "cache-control": { value: "public, max-age=60" },
    },
    body: body,
  };
}

// Any real static file served by the default behavior's S3 origin has a dotted extension
// (index.html, favicon.svg, robots.txt, …). A path with no extension (and isn't bare "/", which
// CloudFront's default_root_object already resolves to index.html at the origin) is a client-side
// route or a stale deep link — rewrite it to /index.html so the SPA renders instead of the origin
// having to 403/404 a missing key.
var HAS_EXTENSION_RE = /\.[a-zA-Z0-9]+$/;

function handler(event) {
  var request = event.request;

  if (request.uri === "/embed.txt") return handleEmbedTxt(request);

  if (request.uri !== "/" && !HAS_EXTENSION_RE.test(request.uri)) {
    request.uri = "/index.html";
  }
  return request;
}

function handleEmbedTxt(request) {
  var qs = request.querystring || {};
  var recipient = qv(qs, "recipient");
  var asset = qv(qs, "asset");
  var scheme = qv(qs, "scheme");
  var color = qv(qs, "color");
  var presets = qv(qs, "presets");
  var label = qv(qs, "label");
  var name = cleanName(qv(qs, "name"));
  var symbol = qv(qs, "symbol");
  var variant = normVariant(qv(qs, "variant"));
  var logo = normalizeLogoUrl(qv(qs, "logo"));

  var errors = [];
  if (!recipient || !isChiaAddress(recipient)) errors.push("recipient: enter a valid Chia address (xch1…).");

  var assetAttr = null;
  if (asset === "xch") assetAttr = "xch";
  else if (asset && isCatId(asset)) assetAttr = strip0x(asset);
  else errors.push("asset: use xch or a 64-hex CAT asset id.");

  // Scheme/color: explicit color OR a hex scheme → custom; else named (green default). Mirrors
  // src/lib/embed.ts schemeAttr — purple AND orange (HOA) are both named schemes, not just purple.
  var schemeAttr = null;
  var colorAttr = null;
  if (color) {
    if (isHex6(color)) colorAttr = normHex(color);
    else errors.push("color: enter a valid 6-digit hex color (e.g. #7a3dff).");
  } else if (scheme && isHex6(scheme)) {
    colorAttr = normHex(scheme);
  } else if (scheme === "purple" || scheme === "orange") {
    schemeAttr = scheme;
  } else {
    schemeAttr = "green";
  }

  if (errors.length) {
    return textResponse(400, "ERROR: invalid parameters — " + errors.join(" "));
  }

  var attrs = ' src="https://xchtip.app/embed/xch-tip.js"';
  attrs += ' data-recipient="' + esc(recipient) + '"';
  attrs += ' data-asset="' + esc(assetAttr) + '"';
  if (colorAttr) attrs += ' data-color="' + esc(colorAttr) + '"';
  else attrs += ' data-scheme="' + esc(schemeAttr) + '"';
  if (presets) {
    var list = [];
    var parts = String(presets).split(",");
    for (var i = 0; i < parts.length; i++) {
      var n = Number(parts[i]);
      if (isFinite(n) && n > 0) list.push(String(n));
    }
    if (list.length) attrs += ' data-amount-presets="' + esc(list.join(",")) + '"';
  }
  if (label) attrs += ' data-label="' + esc(label) + '"';
  if (symbol) attrs += ' data-symbol="' + esc(symbol) + '"';
  if (variant && variant !== "button") attrs += ' data-variant="' + esc(variant) + '"';
  if (name) attrs += ' data-name="' + esc(name) + '"';
  if (logo) attrs += ' data-logo="' + esc(logo) + '"';

  return textResponse(200, "<script" + attrs + " async></script>");
}
