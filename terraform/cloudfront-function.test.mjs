// Regression tests for the viewer-request CloudFront Function (cloudfront-function.js).
//
// The file MUST stay a single, export-free script (the CloudFront Functions runtime evaluates it
// directly and looks for a top-level `handler`), so it can't `module.exports` for testing. Instead,
// `vm.runInContext` evaluates the real source in a sandbox and pulls out `handler` — these tests
// exercise the ACTUAL deployed script, not a copy.
//
// Bug under regression test (#221 live-broken OG cards): the distribution's blanket
// `custom_error_response` (403/404 -> 200 /index.html) applied to the WHOLE distribution regardless
// of origin, so a genuine auth/OAC failure on the /og or /jar/* Lambda origins was silently masked as
// a 200 SPA page. The fix moves SPA-fallback routing into this edge function (so S3 never needs to
// 403 a missing key for a client-side route), letting the distribution-wide error mapping be removed
// entirely — see main.tf / cloudfront-function.tf. These tests pin the function's routing contract so
// that fix can't regress silently.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(path.join(__dirname, "cloudfront-function.js"), "utf8");

// A real, checksum-valid xch address used elsewhere in this repo's test fixtures (src/lib/bech32m.test.ts).
const VALID_XCH_ADDRESS = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

function loadHandler() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}\nthis.__handler = handler;`, sandbox, { filename: "cloudfront-function.js" });
  return sandbox.__handler;
}

function request(uri, querystring = {}) {
  return { request: { uri, querystring } };
}

test("passes a real static file (has a dotted extension) through unchanged", () => {
  const handler = loadHandler();
  const result = handler(request("/favicon.svg"));
  assert.equal(result.uri, "/favicon.svg");
});

test("passes bare / through unchanged (default_root_object already resolves it)", () => {
  const handler = loadHandler();
  const result = handler(request("/"));
  assert.equal(result.uri, "/");
});

test("rewrites an extensionless client-side route to /index.html (SPA fallback)", () => {
  const handler = loadHandler();
  const result = handler(request("/some-deep-link"));
  assert.equal(result.uri, "/index.html");
});

test("rewrites a stale/typo'd deep link with no extension to /index.html", () => {
  const handler = loadHandler();
  const result = handler(request("/jar-preview/xch1x"));
  assert.equal(result.uri, "/index.html");
});

test("does NOT rewrite /embed.txt (handled by the embed-snippet branch instead)", () => {
  const handler = loadHandler();
  const result = handler(
    request("/embed.txt", {
      recipient: { value: VALID_XCH_ADDRESS },
      asset: { value: "xch" },
    }),
  );
  assert.equal(result.statusCode, 200);
  assert.match(result.body, /^<script.*<\/script>$/);
  assert.match(result.body, new RegExp(`data-recipient="${VALID_XCH_ADDRESS}"`));
});

test("/embed.txt with invalid params returns a 400 text/plain error, not a rewrite", () => {
  const handler = loadHandler();
  const result = handler(request("/embed.txt", {}));
  assert.equal(result.statusCode, 400);
  assert.equal(result.headers["content-type"].value, "text/plain; charset=utf-8");
  assert.match(result.body, /ERROR: invalid parameters/);
});
