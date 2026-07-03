// smoke.mjs — a real end-to-end invocation of the BUILT Lambda bundle (dist/index.js), no AWS
// required: calls the exported `handler` directly with a synthetic Function-URL-shaped event for
// each of the three schemes + a custom logo URL, decodes the base64 PNG body, and writes each to
// disk for a visual spot-check. Run via `npm run smoke` (builds first) after `npm ci`.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", ".smoke-out");
mkdirSync(outDir, { recursive: true });

// pathToFileURL — a bare Windows absolute path (`C:\...`) is NOT a valid ESM import specifier (the
// dynamic `import()` loader parses it as a URL and rejects the `c:` "scheme"); wrapping it in a real
// `file://` URL makes the dynamic import of the built dist/index.js work identically on every OS.
const { handler } = await import(pathToFileURL(join(here, "..", "dist", "index.js")).href);

const DIG_ASSET_ID = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";
const HOA_ASSET_ID = "e816ee18ce2337c4128449bc539fbbe2ecfdd2098c4e7cab4667e223c3bdc23d";
const XCH_ADDR = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

const cases = [
  { file: "green-xch.png", qs: { recipient: XCH_ADDR, name: "Alice" } },
  // The asset mark + the page scheme resolve INDEPENDENTLY (same as everywhere else in the app —
  // see ogCard.test.ts) — asset=DIG alone (no explicit scheme=) still yields the green page default
  // with the DIG mark's own fixed purple/magenta brand gradient disc.
  { file: "dig-mark-default-scheme.png", qs: { recipient: XCH_ADDR, name: "Café Zoë", asset: DIG_ASSET_ID } },
  // The REALISTIC $DIG jar link (as lib/jar.ts's ogImageUrl actually emits it once the builder's
  // $DIG preset sets BOTH asset=DIG and scheme=purple together) — the whole card themes purple.
  {
    file: "purple-dig.png",
    qs: { recipient: XCH_ADDR, name: "Café Zoë", asset: DIG_ASSET_ID, scheme: "purple" },
  },
  { file: "orange-hoa.png", qs: { recipient: XCH_ADDR, asset: HOA_ASSET_ID, scheme: "orange", name: "Neighborhood HOA" } },
  {
    file: "custom-logo.png",
    qs: {
      recipient: XCH_ADDR,
      name: "Bob",
      color: "123456",
      // A real, already-deployed xchtip.app PNG (confirmed `content-type: image/png`) — proves the
      // SUCCESS path (fetch -> embed -> satori <img> render), not just the fail-soft fallback.
      logo: "https://xchtip.app/icon-192.png",
    },
  },
  { file: "invalid-params.png", qs: { asset: "not-a-cat-id", scheme: "nonsense" } },
];

for (const { file, qs } of cases) {
  const res = await handler({ queryStringParameters: qs });
  if (res.statusCode !== 200 || res.headers["content-type"] !== "image/png") {
    throw new Error(`${file}: unexpected response ${JSON.stringify({ status: res.statusCode, headers: res.headers })}`);
  }
  const png = Buffer.from(res.body, "base64");
  writeFileSync(join(outDir, file), png);
  console.log("[smoke] wrote", file, png.length, "bytes");
}

console.log("[smoke] all cases rendered a 200 image/png response.");
