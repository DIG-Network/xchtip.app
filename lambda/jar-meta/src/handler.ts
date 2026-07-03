// handler.ts — the jar-meta Lambda entry (#221 item 2). GET /jar/<recipient>?... -> the SAME static
// index.html the SPA ships, with its <head> rewritten to a PERSONALIZED per-recipient
// title/description/canonical/Open-Graph/Twitter card, so a crawler that never runs JS (Facebook/
// Twitter/Discord/Slack link-unfurlers) still sees the right preview. A JS-executing browser gets a
// BYTE-IDENTICAL <body> + bundle reference — this only rewrites <head> meta tags, so hydration/
// routing/rendering is completely unaffected (the client-side lib/meta.ts DOM mutation still runs on
// top of this for a JS-executing visitor's own tab, keeping SPA navigation in sync).
//
// Thin AWS glue ONLY: the per-jar TEXT model (../../../src/lib/jarMeta.ts), the per-recipient image
// URL (../../../src/lib/jar.ts ogImageUrl), the jar-link parser (jar.ts parseJarPath), and the HTML
// rewrite itself (../../../src/lib/htmlMeta.ts) all live in shared, unit-tested modules the root
// vitest suite covers.
//
// Deployed behind a CloudFront `/jar/*` behavior (terraform/jar-meta.tf) fronting a Lambda Function
// URL. Fetches the site's OWN built index.html over HTTPS from SITE_ORIGIN — the SAME CloudFront
// distribution's default behavior, which serves it straight from S3 — rather than reading S3
// directly, so this Lambda needs NO AWS SDK / IAM S3 permissions at all, just outbound network
// access (every Lambda has that by default). The fetched HTML is cached in-memory for
// INDEX_HTML_CACHE_MS to avoid re-fetching on every invocation (Lambda execution environments are
// reused across invocations in the same warm container).

import { parseJarPath, jarUrl, ogImageUrl } from "../../../src/lib/jar.js";
import { buildJarMetaText } from "../../../src/lib/jarMeta.js";
import { injectHtmlMeta } from "../../../src/lib/htmlMeta.js";

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://xchtip.app";
const INDEX_HTML_CACHE_MS = 30_000;

/** The subset of a Lambda Function URL (payload format 2.0) event this handler needs. */
interface JarMetaLambdaEvent {
  rawPath?: string;
  rawQueryString?: string;
}

interface JarMetaLambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

let cachedHtml: { html: string; fetchedAt: number } | null = null;

/**
 * fetchIndexHtml — the site's built `index.html`, cached in-memory for INDEX_HTML_CACHE_MS. On a
 * fetch failure, serves a STALE cached copy rather than failing outright (better a slightly-behind
 * default shell than no page at all); only propagates when there is truly nothing cached yet.
 */
async function fetchIndexHtml(): Promise<string> {
  if (cachedHtml && Date.now() - cachedHtml.fetchedAt < INDEX_HTML_CACHE_MS) return cachedHtml.html;
  try {
    const res = await fetch(`${SITE_ORIGIN}/index.html`);
    if (!res.ok) throw new Error(`index.html fetch failed: HTTP ${res.status}`);
    const html = await res.text();
    cachedHtml = { html, fetchedAt: Date.now() };
    return html;
  } catch (err) {
    if (cachedHtml) return cachedHtml.html;
    throw err;
  }
}

export async function handler(event: JarMetaLambdaEvent): Promise<JarMetaLambdaResponse> {
  const pathname = event.rawPath || "/";
  const search = event.rawQueryString || "";

  try {
    const html = await fetchIndexHtml();

    let parsed;
    try {
      parsed = parseJarPath(pathname, search);
    } catch {
      // A malformed percent-encoded path (decodeURIComponent can throw) is just an invalid jar
      // link — serve the unmodified default shell; the SPA renders its own error state.
      parsed = { ok: false as const, error: "" };
    }

    // Not a jar route at all, or an invalid one (bad/missing recipient) -> the unmodified default
    // shell (non-jar routes keep the site-wide og.png; an invalid jar renders its own client error).
    if (!parsed || !parsed.ok) return htmlResponse(html);

    const { config } = parsed;
    const { title, description } = buildJarMetaText({
      asset: config.asset,
      symbol: config.symbol,
      name: config.name,
    });
    const canonical = jarUrl(config, SITE_ORIGIN);
    const image = ogImageUrl(config, SITE_ORIGIN);
    return htmlResponse(injectHtmlMeta(html, { title, description, canonical, image }));
  } catch {
    // The origin fetch itself failed AND there is no cached fallback — genuinely nothing to serve.
    return {
      statusCode: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: "xchtip.app is temporarily unavailable.",
    };
  }
}

function htmlResponse(html: string): JarMetaLambdaResponse {
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Short + revalidating (matches terraform's html_open response-headers policy) — the
      // underlying index.html changes on every frontend deploy (new hashed asset refs), so this
      // must never be immutable.
      "cache-control": "public, max-age=60, must-revalidate, stale-while-revalidate=86400",
    },
    body: html,
  };
}
