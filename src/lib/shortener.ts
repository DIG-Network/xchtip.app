// shortener.ts — the client for the *.xchtip.app URL-shortener service.
//
// The deterministic tip-jar link (`/jar/<recipient>?…`) is long. This service stores a short code →
// that target URL and serves `https://<code>.xchtip.app` as a redirect to it, so a recipient can hand
// out a memorable link. The tip PAGE stays 100% deterministic + backend-free (§lib/jar.ts); the
// shortener is a pure convenience layer on top — if it is unavailable, the full jar link always works.
//
// This module is the thin fetch client. The service contract:
//   POST {SHORTENER_API}/shorten   body: { url: string }   → 200 { code, shortUrl }  | 4xx { error }
// The API base is injected at build time (VITE_SHORTENER_API); absent → shortening is unavailable
// (the UI hides the affordance / reports it gracefully).

/** The shortener API base URL, injected at build time. Empty string ⇒ the service is not configured. */
export const SHORTENER_API: string = (import.meta.env.VITE_SHORTENER_API as string | undefined) ?? "";

/** Whether the shortener service is configured for this build. */
export function shortenerAvailable(): boolean {
  return SHORTENER_API.trim() !== "";
}

/** A successful shorten result. */
export interface ShortenResult {
  /** The short code (the `<code>` in `<code>.xchtip.app`). */
  code: string;
  /** The full short URL (`https://<code>.xchtip.app`). */
  shortUrl: string;
}

/**
 * shorten — create a short link for `targetUrl`. Resolves to the short URL, or rejects with an Error
 * whose message is safe to show. Never throws synchronously. The caller is expected to fall back to
 * the full deterministic link on failure (it always works).
 *
 * `fetchImpl` is injectable so the flow is unit-testable without a network.
 */
export async function shorten(
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
  apiBase: string = SHORTENER_API,
): Promise<ShortenResult> {
  const base = apiBase.trim().replace(/\/+$/, "");
  if (!base) throw new Error("The link shortener isn't available.");

  const res = await fetchImpl(`${base}/shorten`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: targetUrl }),
  });

  if (!res.ok) {
    // Surface a stable, non-leaky message; the detail is in the response for logs.
    throw new Error(`Shorten failed (${res.status}).`);
  }

  const data: unknown = await res.json().catch(() => null);
  const code = isRecord(data) && typeof data.code === "string" ? data.code : null;
  const shortUrl = isRecord(data) && typeof data.shortUrl === "string" ? data.shortUrl : null;
  if (!code || !shortUrl) throw new Error("The shortener returned an unexpected response.");
  return { code, shortUrl };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
