// JarPage — the recipient's standalone, DETERMINISTIC tip-jar landing page.
//
// A tipper opens `https://xchtip.app/jar/<recipient>?…` (or a short `<name>.xchtip.app` link that
// redirects here) and gets a full, branded page with the recipient's tip button — ready to connect a
// wallet and send on-chain. EVERY piece of state lives in the URL (see lib/jar.ts); there is NO
// backend storing landing pages, so the page is 100% reconstructable from the link alone.
//
// The real tip flow is the canonical embed widget (`/embed/xch-tip.js`): this page mounts it,
// preconfigured from the parsed JarConfig, so the page is the WORKING widget on a hosted surface —
// not a mock. An invalid link renders a clean, deterministic error with a route back to the builder.

import { useEffect, useRef } from "react";
import type { JarParseResult, JarConfig } from "@/lib/jar";
import { jarAssetAttr } from "@/lib/jar";
import { assetSymbol, defaultPresetsFor } from "@/lib/embed";
import { shortenMiddle } from "@/lib/format";
import { useCopy } from "@/components/useCopy";
import { EMBED_PATH } from "@/lib/constants";
import { S } from "@/lib/strings";

export interface JarPageProps {
  /** The parsed jar route result (valid config, or an error). */
  result: JarParseResult;
  /**
   * Origin for absolute links, accepted for API symmetry with the other route components + tests.
   * The tip page itself is origin-agnostic (the embed asset + the "home" link are root-relative, so
   * a short-link host serves it identically), so this is currently unused by the render.
   */
  origin?: string;
}

export function JarPage({ result }: JarPageProps) {
  return (
    <>
      <a href="#jar" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="jar-brand-link" href="/">
            <span className="brand" aria-hidden="true">
              ♥
            </span>
            <span className="brand-name">
              xchtip<span className="brand-tld">.app</span>
            </span>
          </a>
          <span className="header-tag">{S.jarHeaderTag}</span>
        </div>
      </header>

      <main id="jar" className="jar-main">
        {result.ok ? (
          <JarBody config={result.config} />
        ) : (
          <JarError reason={result.error} />
        )}
      </main>

      <footer className="site-footer">
        <p>{S.poweredBy}</p>
        <p>
          <a href="/">{S.jarFooterCta}</a>
        </p>
      </footer>
    </>
  );
}

// ── The valid jar: identity + suggested amounts + the live widget + the Chia story. ──────────────
function JarBody({ config }: { config: JarConfig }) {
  const symbol = assetSymbol(config.asset);
  const displayName = config.name?.trim() || null;
  const heading = displayName ? S.jarHeadingNamed.replace("{name}", displayName) : S.jarHeadingGeneric;
  const amounts = config.presets && config.presets.length ? config.presets : defaultPresetsFor(config.asset);

  // Deterministic page title (no backend) — reflects the name + asset so a shared link previews well.
  useEffect(() => {
    document.title = displayName
      ? `Tip ${displayName} in ${symbol} · xchtip.app`
      : `Send a ${symbol} tip · xchtip.app`;
  }, [displayName, symbol]);

  return (
    <div className="jar-card" data-testid="jar-card">
      <p className="jar-eyebrow">{S.jarEyebrow}</p>
      <h1 className="jar-heading">{heading}</h1>
      <p className="jar-sub">
        {S.jarSub} <span data-testid="jar-asset" className="jar-asset">{symbol}</span>.
      </p>

      <JarAddress recipient={config.recipient} />

      {/* Suggested amounts (display-only echo of what the widget offers; the widget owns the flow). */}
      <ul className="jar-amounts" data-testid="jar-amounts" aria-label={S.jarAmountsLabel}>
        {amounts.map((a) => (
          <li key={a} className="jar-amount">
            {String(a)} {symbol}
          </li>
        ))}
      </ul>

      {/* The real widget mounts here, preconfigured from the URL. */}
      <JarWidget config={config} />

      <p className="jar-note">{S.jarNote}</p>

      {/* Why Chia — the honest value story (low fees, fast, self-custodial). */}
      <ul className="jar-benefits" data-testid="jar-benefits">
        <li>
          <strong>{S.jarBenefit1Title}</strong>
          <span>{S.jarBenefit1Body}</span>
        </li>
        <li>
          <strong>{S.jarBenefit2Title}</strong>
          <span>{S.jarBenefit2Body}</span>
        </li>
        <li>
          <strong>{S.jarBenefit3Title}</strong>
          <span>{S.jarBenefit3Body}</span>
        </li>
      </ul>
    </div>
  );
}

// The recipient identity chip: an elegant middle-truncation that copies the FULL address on click.
function JarAddress({ recipient }: { recipient: string }) {
  const { copied, copy } = useCopy(recipient);
  return (
    <button
      type="button"
      className="jar-address"
      data-testid="jar-address"
      data-copied={copied ? "true" : "false"}
      onClick={copy}
      title={recipient}
      aria-label={`${S.jarCopyAddress}: ${recipient}`}
    >
      <span className="jar-address-to">{S.jarTo}</span>
      <code>{shortenMiddle(recipient)}</code>
      <span className="jar-address-copy" aria-hidden="true">
        {copied ? "✓" : "⧉"}
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}

// Mounts the canonical embed widget (/embed/xch-tip.js), preconfigured from the JarConfig, into a
// container the page owns. Deterministic: attributes derive only from the config (which came only
// from the URL). Rebuilt on config change; cleaned up on unmount.
function JarWidget({ config }: { config: JarConfig; origin?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const script = document.createElement("script");
    // Root-relative src: the embed asset is always served same-origin as the tip page, so a
    // root-relative path is correct on production AND on any preview/short-link host — no origin math.
    script.setAttribute("src", EMBED_PATH);
    script.async = true;
    script.setAttribute("data-recipient", config.recipient);
    script.setAttribute("data-asset", jarAssetAttr(config));
    if (config.scheme === "custom" && config.color) script.setAttribute("data-color", config.color);
    else if (config.scheme === "purple") script.setAttribute("data-scheme", "purple");
    else script.setAttribute("data-scheme", "green");
    if (config.presets && config.presets.length) {
      script.setAttribute("data-amount-presets", config.presets.join(","));
    }
    if (config.label) script.setAttribute("data-label", config.label);
    // A tip PAGE wants a prominent button — the widget's large size.
    script.setAttribute("data-size", "lg");
    // Mount into this container (the widget targets it).
    script.setAttribute("data-target", `#${WIDGET_MOUNT_ID}`);

    mount.appendChild(script);
    return () => {
      mount.replaceChildren();
    };
  }, [config]);

  return (
    <div className="jar-widget" data-testid="jar-widget" ref={mountRef}>
      <div id={WIDGET_MOUNT_ID} className="jar-widget-target" />
    </div>
  );
}

const WIDGET_MOUNT_ID = "xt-jar-mount";

// ── The invalid jar: a clean dead-end with a route home. ─────────────────────────────────────────
function JarError({ reason }: { reason: string }) {
  return (
    <div className="jar-error" role="alert" data-testid="jar-error">
      <p className="jar-error-title">{S.jarErrorTitle}</p>
      <p className="jar-error-body">{reason || S.jarErrorBody}</p>
      <a className="jar-error-cta" href="/">
        {S.jarErrorCta}
      </a>
    </div>
  );
}
