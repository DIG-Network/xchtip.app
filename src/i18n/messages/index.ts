// The locale → catalog registry. Each non-English locale is a Partial of the English base; the
// resolver merges the locale over English per-key, so a missing translation falls back to English
// (the app is always fully rendered). Catalogs are loaded synchronously (the app is small; the total
// catalog weight is tiny) and keyed by the canonical locale code.

import { en, type Messages, type MessageKey } from "./en";
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";
import { ko } from "./ko";
import { ja } from "./ja";
import { ru } from "./ru";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { fr } from "./fr";
import { de } from "./de";
import { tr } from "./tr";
import { vi } from "./vi";
import { id } from "./id";
import { hi } from "./hi";
import { DEFAULT_LOCALE } from "../locales";

/** A partial catalog: any subset of the message keys (missing keys fall back to English). */
export type PartialMessages = Partial<Messages>;

const CATALOGS: Record<string, PartialMessages> = {
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ko,
  ja,
  ru,
  es,
  "pt-BR": ptBR,
  fr,
  de,
  tr,
  vi,
  id,
  hi,
};

/** All message keys (from the English base). */
export const MESSAGE_KEYS = Object.keys(en) as MessageKey[];

/**
 * messagesFor — the full, resolved message map for a locale: the locale's catalog merged OVER the
 * English base, so every key is present (English fallback for anything untranslated).
 */
export function messagesFor(locale: string): Messages {
  const override = CATALOGS[locale] ?? {};
  return { ...en, ...override };
}

export { DEFAULT_LOCALE };
export type { Messages, MessageKey };
