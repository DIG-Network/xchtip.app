// scripts/smoke.mjs — a real end-to-end invocation of the BUILT jar-meta Lambda bundle
// (dist/index.js), no AWS/network required: stubs the global `fetch` to return a canned index.html
// fixture (the same <head> shape as the real dist/index.html), then calls the exported `handler`
// with synthetic Lambda-Function-URL-shaped events for a valid personalized jar link, an invalid
// jar link, and a bare non-jar path — asserting the injected (or deliberately untouched) <head>.
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const DEFAULT_TITLE = "xchtip.app — Embeddable Chia tip button builder (XCH or any CAT)";
const FIXTURE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>${DEFAULT_TITLE}</title>
    <meta name="description" content="default description" />
    <link rel="canonical" href="https://xchtip.app/" />
    <meta property="og:title" content="${DEFAULT_TITLE}" />
    <meta property="og:description" content="default description" />
    <meta property="og:url" content="https://xchtip.app/" />
    <meta property="og:image" content="https://xchtip.app/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${DEFAULT_TITLE}" />
    <meta name="twitter:description" content="default description" />
    <meta name="twitter:image" content="https://xchtip.app/og.png" />
  </head>
  <body><div id="root"></div><script type="module" src="/assets/index-abc123.js"></script></body>
</html>`;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  return { ok: true, status: 200, text: async () => FIXTURE_HTML };
};

const { handler } = await import(pathToFileURL(join(here, "..", "dist", "index.js")).href);

const DIG_ASSET_ID = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";
const XCH_ADDR = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

function assert(cond, msg) {
  if (!cond) throw new Error(`[smoke] FAILED: ${msg}`);
}

// 1) A valid, personalized $DIG jar link -> a fully personalized card.
{
  const res = await handler({
    rawPath: `/jar/${XCH_ADDR}`,
    rawQueryString: `asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`,
  });
  assert(res.statusCode === 200, "expected 200");
  assert(res.headers["content-type"].startsWith("text/html"), "expected text/html content-type");
  assert(res.body.includes("<title>Tip Alice in $DIG · xchtip.app</title>"), "expected the personalized title");
  assert(
    res.body.includes(
      `<meta property="og:url" content="https://xchtip.app/jar/${XCH_ADDR}?asset=${DIG_ASSET_ID}&amp;scheme=purple&amp;name=Alice" />`,
    ),
    "expected the canonical jar URL as og:url",
  );
  assert(
    res.body.includes(
      `<meta property="og:image" content="https://xchtip.app/og?recipient=${XCH_ADDR}&amp;asset=${DIG_ASSET_ID}&amp;name=Alice&amp;scheme=purple" />`,
    ),
    "expected the personalized /og image URL",
  );
  assert(!res.body.includes(DEFAULT_TITLE), "the generic default title must be gone");
  console.log("[smoke] valid $DIG jar link -> personalized meta: OK");
}

// 2) An invalid jar link (unparsable recipient) -> unmodified default shell, still 200 (the SPA
//    itself renders the client-side error state — this Lambda never turns a bad link into a 4xx).
{
  const res = await handler({ rawPath: "/jar/not-an-address", rawQueryString: "" });
  assert(res.statusCode === 200, "expected 200 for an invalid jar link");
  assert(res.body.includes(`<title>${DEFAULT_TITLE}</title>`), "expected the default title, unmodified");
  console.log("[smoke] invalid jar link -> unmodified default shell: OK");
}

// 3) A bare /jar/ (no recipient segment) -> unmodified default shell.
{
  const res = await handler({ rawPath: "/jar/", rawQueryString: "" });
  assert(res.statusCode === 200, "expected 200");
  assert(res.body.includes(`<title>${DEFAULT_TITLE}</title>`), "expected the default title, unmodified");
  console.log("[smoke] bare /jar/ -> unmodified default shell: OK");
}

// 4) The in-memory index.html cache avoids re-fetching on every invocation within the TTL window.
{
  const before = fetchCalls;
  await handler({ rawPath: `/jar/${XCH_ADDR}`, rawQueryString: "" });
  assert(fetchCalls === before, `expected the cached index.html to be reused (fetch calls: ${before} -> ${fetchCalls})`);
  console.log("[smoke] in-memory index.html cache reused across invocations: OK");
}

console.log("[smoke] all cases passed.");
