// embedPreviewPath.ts — route matching for `/embed-preview` (see
// features/embedPreview/EmbedPreviewPage.tsx), kept in lib/ (not co-located with the page
// component) so the predicate stays a plain, fast-refresh-friendly export — the same convention
// lib/jar.ts follows for isJarPath.

/** True when a pathname addresses the embed-preview route (tolerates a trailing slash). */
export function isEmbedPreviewPath(pathname: string): boolean {
  return /^\/embed-preview\/?$/.test(pathname);
}
