// meta.test.ts — per-page document meta (title/description/canonical/OG/Twitter) for the SPA
// routes. Verified against a jsdom document: applyMeta sets/updates the tags idempotently and
// restores them on cleanup, so navigating between SPA routes never leaves stale social cards.

import { describe, it, expect, beforeEach } from "vitest";
import { applyMeta } from "./meta";

function content(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute("content") ?? null;
}
function href(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute("href") ?? null;
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.title = "";
});

describe("applyMeta", () => {
  it("sets title, description, canonical, OG + Twitter tags", () => {
    applyMeta({
      title: "Tip Alice in $DIG · xchtip.app",
      description: "Send Alice a tip in $DIG on Chia.",
      canonical: "https://xchtip.app/jar/xch1abc?asset=deadbeef",
    });
    expect(document.title).toBe("Tip Alice in $DIG · xchtip.app");
    expect(content('meta[name="description"]')).toBe("Send Alice a tip in $DIG on Chia.");
    expect(href('link[rel="canonical"]')).toBe("https://xchtip.app/jar/xch1abc?asset=deadbeef");
    expect(content('meta[property="og:title"]')).toBe("Tip Alice in $DIG · xchtip.app");
    expect(content('meta[property="og:description"]')).toBe("Send Alice a tip in $DIG on Chia.");
    expect(content('meta[property="og:url"]')).toBe("https://xchtip.app/jar/xch1abc?asset=deadbeef");
    expect(content('meta[name="twitter:title"]')).toBe("Tip Alice in $DIG · xchtip.app");
  });

  it("updates existing tags in place (idempotent, no duplicates)", () => {
    applyMeta({ title: "First", description: "one", canonical: "https://xchtip.app/a" });
    applyMeta({ title: "Second", description: "two", canonical: "https://xchtip.app/b" });
    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(content('meta[property="og:title"]')).toBe("Second");
    expect(href('link[rel="canonical"]')).toBe("https://xchtip.app/b");
  });

  it("returns a restore fn that reverts what it created", () => {
    const restore = applyMeta({ title: "Jar", description: "d", canonical: "https://xchtip.app/j" });
    expect(document.head.querySelector('meta[property="og:title"]')).not.toBeNull();
    restore();
    // Tags this call created are removed on restore (nothing pre-existed).
    expect(document.head.querySelector('meta[property="og:title"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  // `image` is OPTIONAL and forward-looking: a future per-jar OG/Twitter-card image generator
  // (#221) will pass a per-recipient `/og?...` URL here. Omitting it must leave the page's default
  // og:image/twitter:image (set in index.html) completely untouched — no hardcoded assumption that
  // would make a later per-jar override awkward.
  it("leaves the default og:image/twitter:image untouched when `image` is omitted", () => {
    document.head.innerHTML =
      '<meta property="og:image" content="https://xchtip.app/og.png">' +
      '<meta name="twitter:image" content="https://xchtip.app/og.png">';
    applyMeta({ title: "Jar", description: "d", canonical: "https://xchtip.app/j" });
    expect(content('meta[property="og:image"]')).toBe("https://xchtip.app/og.png");
    expect(content('meta[name="twitter:image"]')).toBe("https://xchtip.app/og.png");
  });

  it("sets a per-page og:image/twitter:image when `image` is given, and restores the default on cleanup", () => {
    document.head.innerHTML = '<meta property="og:image" content="https://xchtip.app/og.png">';
    const restore = applyMeta({
      title: "Jar",
      description: "d",
      canonical: "https://xchtip.app/j",
      image: "https://xchtip.app/og?recipient=xch1abc",
    });
    expect(content('meta[property="og:image"]')).toBe("https://xchtip.app/og?recipient=xch1abc");
    expect(content('meta[name="twitter:image"]')).toBe("https://xchtip.app/og?recipient=xch1abc");
    restore();
    expect(content('meta[property="og:image"]')).toBe("https://xchtip.app/og.png");
  });
});
