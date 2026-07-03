// Test helpers: render a component tree wrapped in the app's I18nProvider so components using
// react-intl (useT) work in unit tests. `renderIntl` mirrors RTL's render signature.

/* eslint-disable react-refresh/only-export-components -- test-only helpers, not an HMR boundary */
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { I18nProvider } from "@/i18n/I18nProvider";

export function IntlWrapper({ children }: { children: ReactNode }) {
  // Force English so assertions against English copy are stable regardless of the test env locale.
  return <I18nProvider initial="en">{children}</I18nProvider>;
}

export function renderIntl(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  return render(ui, { wrapper: IntlWrapper, ...options });
}
