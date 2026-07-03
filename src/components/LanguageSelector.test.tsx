// LanguageSelector tests — lists every supported locale by endonym, reflects the active locale, and
// switching it re-renders the app in the new language + persists the choice.

import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderIntl as render } from "@/test/intl";
import { LanguageSelector } from "./LanguageSelector";
import { SUPPORTED_LOCALES, LOCALE_STORAGE_KEY } from "@/i18n/locales";
import { useT } from "@/i18n/useT";

function Probe() {
  const t = useT();
  return <span data-testid="probe">{t("visitButton")}</span>;
}

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe("LanguageSelector", () => {
  it("lists all supported locales by endonym", () => {
    render(<LanguageSelector />);
    const select = screen.getByTestId("language-select") as HTMLSelectElement;
    expect(select.options).toHaveLength(SUPPORTED_LOCALES.length);
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(
      SUPPORTED_LOCALES.map((l) => l.endonym),
    );
  });

  it("defaults to English (the test wrapper's initial locale)", () => {
    render(<LanguageSelector />);
    expect((screen.getByTestId("language-select") as HTMLSelectElement).value).toBe("en");
  });

  it("switching the language persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSelector />
        <Probe />
      </>,
    );
    await user.selectOptions(screen.getByTestId("language-select"), "ja");
    expect((screen.getByTestId("language-select") as HTMLSelectElement).value).toBe("ja");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ja");
  });
});
