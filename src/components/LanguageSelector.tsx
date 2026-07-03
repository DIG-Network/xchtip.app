// LanguageSelector — a compact, accessible language picker in the header. A native <select> (reliable
// keyboard + screen-reader support, zero deps) listing every supported locale by its ENDONYM (native
// name). Changing it switches the app locale and persists the choice (via useLocale).

import { useT } from "@/i18n/useT";
import { useLocale } from "@/i18n/I18nProvider";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <label className="lang-select">
      <span className="sr-only">{t("languageLabel")}</span>
      <select
        aria-label={t("languageLabel")}
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        data-testid="language-select"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.endonym}
          </option>
        ))}
      </select>
    </label>
  );
}
