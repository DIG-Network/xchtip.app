// logo.ts — validation for the optional custom `logo` URL (a user-supplied coin/brand mark shown
// next to the asset name on the jar page and on the embed widget's own button, overriding the
// built-in DIG/HOA/XCH mark). See SPEC.md §5/§6/§6a/§6b.
//
// SECURITY: a logo URL is rendered ONLY as a plain `<img src>` (never inline HTML/SVG markup, never
// a CSS background) — see components/SafeLogoImage.tsx. This module additionally restricts the
// SCHEME so an unexpected/dangerous URL (`javascript:`, `vbscript:`, `file:`, `blob:`, plain
// `http:`) can never even reach that attribute. Only `https://` and `data:image/*` are accepted.
// `data:image/svg+xml` is safe here specifically because it is only ever used as an `<img src>` —
// browsers render an `<img>`-loaded SVG in "image mode" with scripting disabled, unlike an
// `<object>`/`<iframe>`/inline-markup SVG.

const ALLOWED_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|gif|webp|svg\+xml)(;charset=[\w-]+)?;base64,/i;

/**
 * normalizeLogoUrl — trim + validate a would-be logo URL. Returns the trimmed URL when it is an
 * `https://` URL or an allowed `data:image/*;base64,` URL, otherwise `null` (silently dropped —
 * an unsupported/dangerous scheme falls back to the built-in mark, never a hard error).
 */
export function normalizeLogoUrl(raw: unknown): string | null {
  const s = String(raw == null ? "" : raw).trim();
  if (s === "") return null;
  if (/^https:\/\//i.test(s)) return s;
  if (ALLOWED_DATA_IMAGE_RE.test(s)) return s;
  return null;
}
