// jarMeta.ts — PURE per-recipient <head> TEXT model (title + description) for a jar page (#221 item
// 2), computed from the same inputs as JarConfig using the SAME English message templates
// JarPage.tsx reads via react-intl (src/i18n/messages/en.ts). This module has NO react-intl/React
// dependency, so it is reusable by the server-side jar-meta Lambda (lambda/jar-meta/), which has no
// React runtime — the crawler-visible DEFAULT card is always English; a JS-executing visitor's own
// tab still gets the user's active locale via JarPage's own applyMeta() call, unaffected by this
// module. This mirrors ogCard.ts's own English-only "Tip me in {symbol}" pitch text — a consistent
// choice, not a regression: no card/preview text is localized today.

import { assetSymbol, type Asset } from "./embed";
import { en } from "../i18n/messages/en";

/** The minimal per-jar text inputs (a subset of JarConfig — no DOM/React types needed here). */
export interface JarMetaInput {
  asset: Asset;
  /** Optional CAT symbol override (mirrors JarConfig.symbol). */
  symbol: string | null;
  /** Optional display name (mirrors JarConfig.name; already sanitized upstream — normalizeDisplayName). */
  name: string | null;
}

/** The resolved `<title>` + meta-description text for a jar page. */
export interface JarMetaText {
  title: string;
  description: string;
}

/**
 * buildJarMetaText — the English `<title>` + meta-description text for a jar page, matching
 * JarPage.tsx's own `t("jarMetaTitleNamed"/"jarMetaTitleGeneric"/"jarMetaDescription")`
 * computation byte-for-byte for the `en` locale (same template ids, same
 * `{name}`/`{asset}`/`{who}` substitution order).
 */
export function buildJarMetaText(input: JarMetaInput): JarMetaText {
  const symbol = input.symbol?.trim() || assetSymbol(input.asset);
  const displayName = input.name?.trim() || null;
  const title = displayName
    ? en.jarMetaTitleNamed.replace("{name}", displayName).replace("{asset}", symbol)
    : en.jarMetaTitleGeneric.replace("{asset}", symbol);
  const who = displayName ?? en.jarMetaWhoGeneric;
  const description = en.jarMetaDescription.replace("{who}", who).replace("{asset}", symbol);
  return { title, description };
}
