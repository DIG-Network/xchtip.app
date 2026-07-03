import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isSupportedLocale,
  localeEntry,
  resolveOne,
  resolveLocale,
  detectBrowserLocale,
  initialLocale,
  persistLocale,
  LOCALE_STORAGE_KEY,
} from "./locales";

describe("locale registry", () => {
  it("ships the ecosystem's 14 locales, English first", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(14);
    expect(SUPPORTED_LOCALES[0].code).toBe("en");
    expect(SUPPORTED_LOCALES.map((l) => l.code)).toEqual([
      "en", "zh-CN", "zh-TW", "ko", "ja", "ru", "es", "pt-BR", "fr", "de", "tr", "vi", "id", "hi",
    ]);
    for (const l of SUPPORTED_LOCALES) {
      expect(l.endonym).toBeTruthy();
      expect(l.englishName).toBeTruthy();
    }
  });

  it("isSupportedLocale + localeEntry", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("pt-BR")).toBe(true);
    expect(isSupportedLocale("sw")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(localeEntry("ja")?.endonym).toBe("日本語");
    expect(localeEntry("xx")).toBeUndefined();
  });
});

describe("resolveOne", () => {
  it("exact canonical", () => {
    expect(resolveOne("en")).toBe("en");
    expect(resolveOne("zh-CN")).toBe("zh-CN");
    expect(resolveOne("pt-BR")).toBe("pt-BR");
  });
  it("case-insensitive + underscores", () => {
    expect(resolveOne("zh-cn")).toBe("zh-CN");
    expect(resolveOne("pt_br")).toBe("pt-BR");
  });
  it("region/script overrides for Traditional Chinese", () => {
    expect(resolveOne("zh-HK")).toBe("zh-TW");
    expect(resolveOne("zh-MO")).toBe("zh-TW");
    expect(resolveOne("zh-Hant")).toBe("zh-TW");
    expect(resolveOne("zh-Hant-TW")).toBe("zh-TW");
  });
  it("primary-language fallback", () => {
    expect(resolveOne("en-GB")).toBe("en");
    expect(resolveOne("pt-PT")).toBe("pt-BR");
    expect(resolveOne("es-419")).toBe("es");
    expect(resolveOne("fr-CA")).toBe("fr");
  });
  it("unsupported language → null", () => {
    expect(resolveOne("sw")).toBeNull();
    expect(resolveOne("")).toBeNull();
    expect(resolveOne(null)).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("returns the first supported tag", () => {
    expect(resolveLocale(["sw", "xx", "de-DE", "en"])).toBe("de");
    expect(resolveLocale(["zh-HK", "en"])).toBe("zh-TW");
  });
  it("defaults when none supported", () => {
    expect(resolveLocale(["sw", "xx"])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
  });
});

describe("detect + persist", () => {
  const orig = globalThis.navigator;
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it("detects from navigator.languages", () => {
    vi.stubGlobal("navigator", { languages: ["fr-FR", "en"] });
    expect(detectBrowserLocale()).toBe("fr");
    vi.stubGlobal("navigator", orig);
  });

  it("initialLocale prefers a valid persisted choice, else detects", () => {
    persistLocale("ja");
    expect(initialLocale()).toBe("ja");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ja");
    localStorage.clear();
    vi.stubGlobal("navigator", { languages: ["de"] });
    expect(initialLocale()).toBe("de");
    vi.stubGlobal("navigator", orig);
  });

  it("ignores an invalid persisted choice", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "sw");
    vi.stubGlobal("navigator", { languages: ["es"] });
    expect(initialLocale()).toBe("es");
    vi.stubGlobal("navigator", orig);
  });
});
