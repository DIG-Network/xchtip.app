// App — the top-level shell. Reads the URL query params ONCE to decide the mode:
//   • raw mode (`?…&raw=1` / `format=raw`) → render ONLY the machine-readable snippet (no chrome).
//   • otherwise → the builder UI (header + panel + footer), pre-filled from any query params.
// Semantic landmarks (header/main/footer) + a skip link for accessibility (§6.6).

import { useMemo } from "react";
import { parseQueryParams } from "@/lib/embed";
import { formFromQuery } from "@/features/builder/useBuilder";
import { BuilderPanel } from "@/features/builder/BuilderPanel";
import { RawSnippet } from "@/features/raw/RawSnippet";
import { S } from "@/lib/strings";

export interface AppProps {
  /** The URL search string (defaults to the live location; injectable for tests). */
  search?: string;
  /** Origin for generated links (defaults to production; injectable for tests). */
  origin?: string;
}

export function App({ search, origin }: AppProps) {
  const rawSearch = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const params = useMemo(() => parseQueryParams(rawSearch), [rawSearch]);
  const initialForm = useMemo(() => formFromQuery(rawSearch), [rawSearch]);

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
          <span className="header-tag">{S.headerTag}</span>
        </div>
      </header>

      <main id="main" className="site-main">
        <div className="hero">
          <p className="hero-kicker">{S.heroKicker}</p>
          <h1 className="hero-title">
            {S.heroTitleLead} <em>{S.heroTitleAccent}</em>
          </h1>
          <p className="hero-intro">{S.intro}</p>
        </div>
        <BuilderPanel initialForm={initialForm} origin={origin} />
      </main>

      <footer className="site-footer">
        <p>{S.poweredBy}</p>
        <p>{S.digNetwork}</p>
      </footer>
    </>
  );
}
