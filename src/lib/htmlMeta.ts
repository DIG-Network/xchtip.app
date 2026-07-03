// htmlMeta.ts — PURE server-side <head> meta injection for the static index.html (#221 item 2). No
// DOM, no dependencies: a real crawler (Facebook/Twitter/Discord/Slack link-unfurlers, and most
// other bots) fetches the page WITHOUT executing JS, so the client-side lib/meta.ts DOM mutation
// (which only helps a JS-executing visitor's own tab) never reaches it. The jar-meta Lambda
// (lambda/jar-meta/) calls injectHtmlMeta on the SAME built index.html the SPA ships, rewriting the
// <title>/description/canonical/Open-Graph/Twitter tags to the per-recipient values BEFORE the
// response leaves the edge — so a crawler unfurling `/jar/<recipient>?...` sees the personalized
// card, while a real browser still gets the identical SPA shell (this never touches the JS bundle
// reference or any non-meta tag).

import { escapeHtmlAttr } from "./embed";

/** The per-page values to inject; every field is required (the caller always has a full model). */
export interface HtmlMetaOverride {
  /** <title> text + og:title + twitter:title. */
  title: string;
  /** meta[name=description] + og:description + twitter:description. */
  description: string;
  /** link[rel=canonical] href + og:url. */
  canonical: string;
  /** og:image + twitter:image (absolute URL, e.g. the per-recipient `/og?...` Lambda). */
  image: string;
}

// setTagText — replace the text content of the FIRST `<tag>...</tag>` match. No-op if absent.
function setTagText(html: string, tag: string, text: string): string {
  const re = new RegExp(`(<${tag}[^>]*>)[\\s\\S]*?(</${tag}>)`, "i");
  return re.test(html) ? html.replace(re, (_m, open: string, close: string) => `${open}${escapeHtmlAttr(text)}${close}`) : html;
}

// setAttr — replace the value of `attr="..."` inside the FIRST tag whose attributes contain
// `matchAttr="matchValue"` (attribute order/line-wrapping agnostic — `[^>]` matches newlines fine,
// since it is a negated class on the literal `>`, not the dot metacharacter). No-op if absent.
function setAttr(html: string, matchAttr: string, matchValue: string, attr: string, value: string): string {
  const re = new RegExp(
    `(<[a-z]+[^>]*\\b${matchAttr}=["']${escapeRegExp(matchValue)}["'][^>]*\\b${attr}=["'])[^"']*(["'][^>]*>)`,
    "i",
  );
  return re.test(html) ? html.replace(re, (_m, pre: string, post: string) => `${pre}${escapeHtmlAttr(value)}${post}`) : html;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * injectHtmlMeta — rewrite `html`'s <title>, description, canonical link, and Open Graph/Twitter
 * tags to `meta`'s values. Every targeted value is HTML-escaped (never trusts the caller to have
 * pre-escaped a URL-sourced display name). Tags this does NOT touch (og:type, og:image:width/height,
 * twitter:card, the JS bundle reference, …) pass through byte-identical. Idempotent: running it
 * twice with the same `meta` yields the same output. Never throws — an html string with no matching
 * tags (or an empty string) is returned unchanged.
 */
export function injectHtmlMeta(html: string, meta: HtmlMetaOverride): string {
  let out = html;
  out = setTagText(out, "title", meta.title);
  out = setAttr(out, "name", "description", "content", meta.description);
  out = setAttr(out, "rel", "canonical", "href", meta.canonical);
  out = setAttr(out, "property", "og:title", "content", meta.title);
  out = setAttr(out, "property", "og:description", "content", meta.description);
  out = setAttr(out, "property", "og:url", "content", meta.canonical);
  out = setAttr(out, "property", "og:image", "content", meta.image);
  out = setAttr(out, "name", "twitter:title", "content", meta.title);
  out = setAttr(out, "name", "twitter:description", "content", meta.description);
  out = setAttr(out, "name", "twitter:image", "content", meta.image);
  return out;
}
