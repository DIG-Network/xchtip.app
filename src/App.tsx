// App — the top-level shell. Reads the URL ONCE to decide the mode:
//   • embed-preview route (`/embed-preview?…`) → render ONLY the live widget for the given params,
//     transparent + chromeless (the hub iframes this for its Developer-tab live preview).
//   • tip-jar route (`/jar/<recipient>?…`) → the recipient's standalone, DETERMINISTIC tip page
//     (all state in the URL — there is no backend that stores landing pages).
//   • raw mode (`?…&raw=1` / `format=raw`) → render ONLY the machine-readable snippet (no chrome).
//   • otherwise → the builder UI (header + panel + footer), pre-filled from any query params.
// Semantic landmarks (header/main/footer) + a skip link for accessibility (§6.6).

import { useMemo } from "react";
import { BugReportButton } from "@dignetwork/components";
import { parseQueryParams } from "@/lib/embed";
import { parseJarPath } from "@/lib/jar";
import { formFromQuery } from "@/features/builder/useBuilder";
import { BuilderPanel } from "@/features/builder/BuilderPanel";
import { RawSnippet } from "@/features/raw/RawSnippet";
import { JarPage } from "@/features/jar/JarPage";
import { EmbedPreviewPage } from "@/features/embedPreview/EmbedPreviewPage";
import { isEmbedPreviewPath } from "@/lib/embedPreviewPath";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useT } from "@/i18n/useT";
import { APP_VERSION } from "@/lib/version";

// The GitHub repo bug reports file into (DIG-Network/xchtip.app) — the shared widget's one
// required prop. `apiBase` and `position` keep their component defaults (api.bugreport.dig.net,
// bottom-right). `appVersion` is passed explicitly (belt-and-suspenders) so every report records
// which build it came from even on a components version that predates auto-detection — see
// src/lib/version.ts.
const BUG_REPORT_REPO = "xchtip.app";

export interface AppProps {
  /** The URL search string (defaults to the live location; injectable for tests). */
  search?: string;
  /** The URL pathname (defaults to the live location; injectable for tests). Drives the /jar route. */
  pathname?: string;
  /** Origin for generated links (defaults to production; injectable for tests). */
  origin?: string;
}

export function App({ search, pathname, origin }: AppProps) {
  const t = useT();
  const rawSearch = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const rawPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const params = useMemo(() => parseQueryParams(rawSearch), [rawSearch]);
  const initialForm = useMemo(() => formFromQuery(rawSearch), [rawSearch]);
  // The tip-jar route wins over the builder when the path addresses /jar (valid OR invalid — an
  // invalid jar link shows the jar error state, not the builder). Raw mode is a query concern and
  // is only meaningful on the builder route.
  const jar = useMemo(() => parseJarPath(rawPath, rawSearch), [rawPath, rawSearch]);

  // The embed-preview route is a distinct, chromeless surface (an iframe target, not a page a
  // human browses directly) — no bug-report button, same reasoning as raw mode below.
  if (isEmbedPreviewPath(rawPath)) {
    return <EmbedPreviewPage search={rawSearch} />;
  }

  if (jar) {
    return (
      <>
        <JarPage result={jar} origin={origin} />
        <BugReportButton repo={BUG_REPORT_REPO} appVersion={APP_VERSION} />
      </>
    );
  }

  // Raw mode renders ONLY the machine-readable snippet for a scraping tool/agent — not a page a
  // human browses, so it gets no chrome, including no floating bug-report button.
  if (params.raw) {
    return <RawSnippet params={params} origin={origin} />;
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <span className="brand" aria-hidden="true">
            ♥
          </span>
          <span className="brand-name">
            xchtip<span className="brand-tld">.app</span>
          </span>
          <span className="header-tag">{t("headerTag")}</span>
          <LanguageSelector />
        </div>
      </header>

      <main id="main" className="site-main">
        <div className="hero">
          <p className="hero-kicker">{t("heroKicker")}</p>
          <h1 className="hero-title">
            {t("heroTitleLead")} <em>{t("heroTitleAccent")}</em>
          </h1>
          <p className="hero-intro">{t("intro")}</p>
        </div>
        <BuilderPanel initialForm={initialForm} origin={origin} />
      </main>

      <footer className="site-footer">
        <p>{t("poweredBy")}</p>
        <p>{t("digNetwork")}</p>
        <p className="footer-version" data-testid="app-version">
          {t("versionLabel", { version: APP_VERSION })}
        </p>
      </footer>

      <BugReportButton repo={BUG_REPORT_REPO} appVersion={APP_VERSION} />
    </>
  );
}
