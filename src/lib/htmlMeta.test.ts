// htmlMeta.test.ts — pure server-side HTML <head> meta injection (#221 item 2). This is what the
// jar-meta Lambda (lambda/jar-meta/) uses to rewrite the static index.html for crawlers that never
// execute JS (Facebook/Twitter/Discord/Slack link-unfurlers) — the client-side lib/meta.ts DOM
// mutation only helps a JS-executing visitor's tab, never a crawler.

import { describe, it, expect } from "vitest";
import { injectHtmlMeta } from "./htmlMeta";

// A trimmed-down stand-in for dist/index.html's <head> — same tags/shape as the real file (title,
// description, canonical, OG, Twitter), including the real file's multi-line attribute formatting,
// so the regexes are proven against realistic whitespace, not just a convenient single-line fixture.
const SAMPLE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>xchtip.app — Embeddable Chia tip button builder (XCH or any CAT)</title>
    <meta
      name="description"
      content="Build a free embeddable Chia tip button for any website."
    />
    <link rel="canonical" href="https://xchtip.app/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="xchtip.app" />
    <meta property="og:title" content="xchtip.app — Embeddable Chia tip button builder" />
    <meta
      property="og:description"
      content="Build a free embeddable Chia tip button for any website."
    />
    <meta property="og:url" content="https://xchtip.app/" />
    <meta property="og:image" content="https://xchtip.app/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="xchtip.app — Embeddable Chia tip button builder" />
    <meta name="twitter:description" content="Build a free embeddable Chia tip button." />
    <meta name="twitter:image" content="https://xchtip.app/og.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
  </body>
</html>
`;

const OVERRIDE = {
  title: "Tip Alice in $DIG · xchtip.app",
  description: "Send Alice a tip in $DIG on Chia — on-chain, wallet to wallet.",
  canonical: "https://xchtip.app/jar/xch1qyqs...s0wg4qq?asset=abc",
  // No `&` here deliberately — the multi-param / `&`-encoding case has its own dedicated test below
  // (an HTML attribute value must HTML-entity-encode a literal `&`, e.g. `&amp;`, so a plain
  // `toContain(rawUrl)` assertion would be wrong for a realistic `/og?a=1&b=2` URL).
  image: "https://xchtip.app/og?recipient=xch1qyqs...s0wg4qq",
};

describe("injectHtmlMeta", () => {
  it("replaces <title> with the per-jar title", () => {
    const out = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    expect(out).toContain(`<title>${OVERRIDE.title}</title>`);
    expect(out).not.toContain("xchtip.app — Embeddable Chia tip button builder (XCH or any CAT)");
  });

  it("replaces meta[name=description] content", () => {
    const out = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    expect(out).toMatch(/name="description"[\s\S]*?content="Send Alice a tip in \$DIG on Chia[^"]*"/);
  });

  it("replaces the canonical link href", () => {
    const out = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    expect(out).toContain(`<link rel="canonical" href="${OVERRIDE.canonical}" />`);
  });

  it("replaces og:title, og:description, og:url, og:image", () => {
    const out = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    expect(out).toContain(`<meta property="og:title" content="${OVERRIDE.title}" />`);
    expect(out).toMatch(/property="og:description"[\s\S]*?content="Send Alice a tip in \$DIG on Chia[^"]*"/);
    expect(out).toContain(`<meta property="og:url" content="${OVERRIDE.canonical}" />`);
    expect(out).toContain(`<meta property="og:image" content="${OVERRIDE.image}" />`);
  });

  it("replaces twitter:title, twitter:description, twitter:image and leaves twitter:card untouched", () => {
    const out = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    expect(out).toContain(`<meta name="twitter:title" content="${OVERRIDE.title}" />`);
    expect(out).toContain(`<meta name="twitter:description" content="${OVERRIDE.description}" />`);
    expect(out).toContain(`<meta name="twitter:image" content="${OVERRIDE.image}" />`);
    expect(out).toContain(`<meta name="twitter:card" content="summary_large_image" />`);
  });

  it("leaves og:image:width/height and every non-targeted tag byte-identical", () => {
    const out = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    expect(out).toContain(`<meta property="og:image:width" content="1200" />`);
    expect(out).toContain(`<meta property="og:image:height" content="630" />`);
    expect(out).toContain(`<meta property="og:type" content="website" />`);
    expect(out).toContain(`<script type="module" crossorigin src="/assets/index-abc123.js"></script>`);
  });

  it("HTML-escapes an injected value so it can never break out of an attribute or inject markup", () => {
    const evil = {
      title: `Tip <script>alert(1)</script> & "quote"`,
      description: "desc",
      canonical: "https://xchtip.app/jar/x",
      image: "https://xchtip.app/og?x=1",
    };
    const out = injectHtmlMeta(SAMPLE_HTML, evil);
    expect(out).not.toContain("<script>alert(1)</script>");
    expect(out).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(out).toContain("&amp;");
    expect(out).toContain("&quot;quote&quot;");
  });

  it("HTML-entity-encodes a literal & in a multi-param image/canonical URL (valid HTML attribute syntax)", () => {
    const multiParam = {
      title: "Tip Alice · xchtip.app",
      description: "desc",
      canonical: "https://xchtip.app/jar/x?asset=abc&scheme=purple",
      image: "https://xchtip.app/og?recipient=x&asset=abc&scheme=purple",
    };
    const out = injectHtmlMeta(SAMPLE_HTML, multiParam);
    expect(out).toContain('href="https://xchtip.app/jar/x?asset=abc&amp;scheme=purple"');
    expect(out).toContain('content="https://xchtip.app/og?recipient=x&amp;asset=abc&amp;scheme=purple"');
    // Never a literal, un-encoded `&` left in an attribute (would be malformed HTML).
    expect(out).not.toMatch(/href="[^"]*&(?!amp;)/);
  });

  it("is idempotent — injecting the same meta twice yields the same result", () => {
    const once = injectHtmlMeta(SAMPLE_HTML, OVERRIDE);
    const twice = injectHtmlMeta(once, OVERRIDE);
    expect(twice).toBe(once);
  });

  it("never throws on a malformed/empty document — returns it unchanged", () => {
    expect(injectHtmlMeta("", OVERRIDE)).toBe("");
    expect(injectHtmlMeta("<html><body>no head tags here</body></html>", OVERRIDE)).toBe(
      "<html><body>no head tags here</body></html>",
    );
  });
});
