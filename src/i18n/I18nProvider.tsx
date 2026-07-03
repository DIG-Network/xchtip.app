// I18nProvider — wires react-intl with our locale registry + catalogs, and exposes the current locale
// + a setter (persisted) via context so the language selector can switch languages at runtime.
//
// The provider resolves the initial locale (persisted choice → browser detection → default), sets
// <html lang>, and feeds react-intl the resolved (English-fallback-merged) catalog for that locale.

/* eslint-disable react-refresh/only-export-components -- provider co-locates its useLocale hook by design */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { IntlProvider } from "react-intl";
import { DEFAULT_LOCALE, initialLocale, persistLocale } from "./locales";
import { messagesFor } from "./messages";

interface LocaleContextValue {
  /** The active locale code (e.g. "en", "pt-BR"). */
  locale: string;
  /** Switch the active locale + persist the choice. */
  setLocale: (code: string) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

/** Read the current locale + setter (for the language selector). */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export interface I18nProviderProps {
  children: ReactNode;
  /** Force a locale (tests/stories); defaults to the detected/persisted locale. */
  initial?: string;
}

export function I18nProvider({ children, initial }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<string>(() => initial ?? initialLocale());

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    persistLocale(code);
  }, []);

  // Keep <html lang> in sync for a11y + SEO.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const messages = useMemo(() => messagesFor(locale), [locale]);
  const ctx = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={ctx}>
      <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
