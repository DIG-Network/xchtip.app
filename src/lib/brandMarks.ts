// brandMarks.ts — the raw vector path data for the built-in brand glyphs (the Chia leaf, the DIG
// "D" mark), extracted as the SINGLE SOURCE both renderers draw from:
//   • the React <AssetGlyph> component (components/AssetGlyph.tsx) — inline <svg><path> for the
//     browser;
//   • the server-side per-recipient OG/Twitter-card image renderer (lib/ogCard.ts, drawn via
//     satori/resvg for the #221 `/og` Lambda).
// Keeping the path data here (not duplicated inline in each renderer) guarantees the two are
// PIXEL-IDENTICAL, never just "the same decision" — a change to the mark shape happens once.

/** The Chia leaf mark path (viewBox `0 0 24 24`) — the XCH built-in glyph. */
export const CHIA_LEAF_PATH =
  "M12 2C7 6 4 10 4 14.5A7.5 7.5 0 0 0 11.5 22c.3 0 .5-.2.5-.5V12c0-.3.2-.5.5-.5s.5.2.5.5v9.5c0 .3.2.5.5.5A7.5 7.5 0 0 0 20 14.5C20 10 17 6 12 2z";

/** The DIG "D" mark path (viewBox `0 0 24 24`) — the canonical $DIG built-in glyph. */
export const DIG_MARK_PATH = "M5 4h6a8 8 0 0 1 0 16H5V4zm3.2 3.1v9.8H11a4.9 4.9 0 0 0 0-9.8H8.2z";
