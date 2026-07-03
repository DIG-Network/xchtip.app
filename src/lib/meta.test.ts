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
});
