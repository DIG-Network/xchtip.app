// The frozen locale registry + BCP-47 resolution — xchtip.app's LOCALE CONTRACT (mirrors the hub's
// i18n/locales.ts so the ecosystem speaks the SAME 14 languages the same way).
//
// Pure + side-effect free (no DOM, no store) so it is exhaustively unit-testable. The IntlProvider
// wiring + the language selector consume it. `SUPPORTED_LOCALES` is a frozen, ordered, self-describing
// table: code + endonym (native name) + English name — a tool can enumerate the supported set.

/** One supported locale: its BCP-47 code + native + English display names. */
export interface LocaleEntry {
  /** The canonical BCP-47 tag we ship a catalog for (e.g. "en", "zh-CN", "pt-BR"). */
  readonly code: string;
  /** The language's own name in its own script — how it is listed in the language selector. */
  readonly endonym: string;
  /** The English name (for tooltips / agent output / accessibility labels). */
  readonly englishName: string;
}

/**
 * The 14 languages xchtip.app ships (the ecosystem's standard set). ORDER = the selector display
 * order (English first, then by rough global reach). `en` is the default + the base catalog every
 * other locale falls back to per missing key.
 */
export const SUPPORTED_LOCALES: readonly LocaleEntry[] = Object.freeze([
  { code: "en", endonym: "English", englishName: "English" },
  { code: "zh-CN", endonym: "简体中文", englishName: "Chinese (Simplified)" },
  { code: "zh-TW", endonym: "繁體中文", englishName: "Chinese (Traditional)" },
  { code: "ko", endonym: "한국어", englishName: "Korean" },
  { code: "ja", endonym: "日本語", englishName: "Japanese" },
  { code: "ru", endonym: "Русский", englishName: "Russian" },
  { code: "es", endonym: "Español", englishName: "Spanish" },
  { code: "pt-BR", endonym: "Português (Brasil)", englishName: "Portuguese (Brazil)" },
  { code: "fr", endonym: "Français", englishName: "French" },
  { code: "de", endonym: "Deutsch", englishName: "German" },
  { code: "tr", endonym: "Türkçe", englishName: "Turkish" },
  { code: "vi", endonym: "Tiếng Việt", englishName: "Vietnamese" },
  { code: "id", endonym: "Bahasa Indonesia", englishName: "Indonesian" },
  { code: "hi", endonym: "हिन्दी", englishName: "Hindi" },
] as const);

/** The default locale — also the base catalog every other locale falls back to per missing key. */
export const DEFAULT_LOCALE = "en";

/** LocalStorage key for the user's explicit language choice. */
export const LOCALE_STORAGE_KEY = "xchtip.locale";

const SUPPORTED_CODES: ReadonlySet<string> = new Set(SUPPORTED_LOCALES.map((l) => l.code));

/** Is `code` one of the exact canonical codes we ship a catalog for? */
export function isSupportedLocale(code: string | null | undefined): code is string {
  return code != null && SUPPORTED_CODES.has(code);
}

/** Look up a locale entry by its canonical code (undefined if not supported). */
export function localeEntry(code: string): LocaleEntry | undefined {
  return SUPPORTED_LOCALES.find((l) => l.code === code);
}

// Primary-language fallbacks (region-agnostic): map a language subtag to the shipped catalog.
const LANGUAGE_FALLBACK: Readonly<Record<string, string>> = Object.freeze({
  en: "en",
  zh: "zh-CN",
  pt: "pt-BR",
  ko: "ko",
  ja: "ja",
  ru: "ru",
  es: "es",
  fr: "fr",
  de: "de",
  tr: "tr",
  vi: "vi",
  id: "id",
  hi: "hi",
});

// Traditional-script Chinese regions map to zh-TW rather than zh-CN.
const REGION_OVERRIDE: Readonly<Record<string, string>> = Object.freeze({
  "zh-TW": "zh-TW",
  "zh-HK": "zh-TW",
  "zh-MO": "zh-TW",
  "zh-Hant": "zh-TW",
});

function normalizeTag(raw: string): { lang: string; langRegion: string | null } {
  const parts = raw.trim().split(/[-_]/);
  if (parts.length === 0 || parts[0] === "") return { lang: "", langRegion: null };
  const lang = parts[0].toLowerCase();
  let sub: string | null = null;
  if (parts[1]) {
    sub =
      parts[1].length === 4
        ? parts[1][0].toUpperCase() + parts[1].slice(1).toLowerCase() // script: Hant
        : parts[1].toUpperCase(); // region: TW
  }
  return { lang, langRegion: sub ? `${lang}-${sub}` : null };
}

/**
 * Resolve a SINGLE raw BCP-47 tag to a supported locale, or null if the language isn't supported.
 *   1. exact canonical match ("zh-CN" → "zh-CN");
 *   2. region/script override ("zh-HK" → "zh-TW");
 *   3. primary-language fallback ("en-GB" → "en", "pt-PT" → "pt-BR").
 */
export function resolveOne(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const { lang, langRegion } = normalizeTag(raw);
  if (!lang) return null;
  if (langRegion && isSupportedLocale(langRegion)) return langRegion;
  if (langRegion && REGION_OVERRIDE[langRegion]) return REGION_OVERRIDE[langRegion];
  return LANGUAGE_FALLBACK[lang] ?? null;
}

/** Resolve the first supported locale from an ordered tag list; DEFAULT_LOCALE if none match. */
export function resolveLocale(preferred: readonly string[] | null | undefined): string {
  for (const tag of preferred ?? []) {
    const hit = resolveOne(tag);
    if (hit) return hit;
  }
  return DEFAULT_LOCALE;
}

/** Detect the best supported locale from the browser (SSR/no-DOM safe). First-run only. */
export function detectBrowserLocale(): string {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
  return resolveLocale(langs);
}

/** The persisted explicit choice (if valid), else the detected browser locale. */
export function initialLocale(): string {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    if (isSupportedLocale(stored)) return stored;
  } catch {
    /* localStorage blocked — fall through to detection */
  }
  return detectBrowserLocale();
}

/** Persist an explicit locale choice (no-throw). */
export function persistLocale(code: string): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}
