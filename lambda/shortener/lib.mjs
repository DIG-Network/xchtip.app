// Pure request/response logic for the xchtip.app shortener — NO AWS imports, so it is unit-testable
// with plain `node --test` and safe to reason about in isolation. The handler (index.mjs) wires
// these to DynamoDB.

/** The base32-ish alphabet for codes: lowercase, no ambiguous chars (no 0/1/o/l/i/u). */
export const CODE_ALPHABET = "abcdefghjkmnpqrstvwxyz23456789";

/** Subdomains we never mint / never treat as short codes (they route elsewhere). */
export const RESERVED_CODES = new Set(["www", "api", "app", "mail", "ns", "cdn", "assets", "static"]);

/** The apex domain, overridable via env for tests/staging. */
export const APEX_DOMAIN = process.env.APEX_DOMAIN || "xchtip.app";

/** Generate a random short code of `len` chars from CODE_ALPHABET, using an injectable RNG (0..1). */
export function makeCode(len = 6, rng = Math.random) {
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return out;
}

/** True for a syntactically valid code (only CODE_ALPHABET chars, 3..16 long). */
export function isValidCode(code) {
  const s = String(code || "");
  if (s.length < 3 || s.length > 16) return false;
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return false;
  return true;
}

/**
 * validateTargetUrl — accept ONLY a well-formed xchtip.app tip-page URL (`https://xchtip.app/jar/…`
 * or the `www.` variant). Returns the canonicalized target (host forced to the apex), or null if it
 * is not an xchtip.app jar URL — so the shortener can never become an open redirector.
 */
export function validateTargetUrl(raw, apex = APEX_DOMAIN) {
  let u;
  try {
    u = new URL(String(raw));
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (host !== apex && host !== `www.${apex}`) return null;
  if (!/^\/jar\/[^/]/.test(u.pathname)) return null;
  u.hostname = apex; // canonicalize away www so every short link points at one origin
  return u.toString();
}

/**
 * codeFromHost — extract the short code from a `<code>.xchtip.app` Host header. Returns null for the
 * apex, www, a reserved label, a multi-level host, or a non-xchtip host. Case-insensitive; strips a
 * port.
 */
export function codeFromHost(hostHeader, apex = APEX_DOMAIN) {
  const host = String(hostHeader || "").toLowerCase().split(":")[0];
  const suffix = `.${apex}`;
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  if (!label || label.includes(".")) return null;
  if (RESERVED_CODES.has(label)) return null;
  if (!isValidCode(label)) return null;
  return label;
}
