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
import { jarAssetAttr, jarUrl } from "@/lib/jar";
import { assetSymbol, defaultPresetsFor } from "@/lib/embed";
import { shortenMiddle } from "@/lib/format";
import { applyMeta } from "@/lib/meta";
import { useCopy } from "@/components/useCopy";
import { SITE_ORIGIN, EMBED_PATH } from "@/lib/constants";
import { useT } from "@/i18n/useT";

export interface JarPageProps {
  /** The parsed jar route result (valid config, or an error). */
  result: JarParseResult;
  /**
   * Origin for the per-page canonical + Open Graph URL (defaults to production; injectable for
   * tests). The tip page's OWN links (the embed asset, the "home" link) are root-relative so a
   * short-link host serves it identically — origin is used ONLY for the absolute social/SEO URL.
   */
  origin?: string;
}

export function JarPage({ result, origin = SITE_ORIGIN }: JarPageProps) {
  const t = useT();
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
          <span className="header-tag">{t("jarHeaderTag")}</span>
        </div>
      </header>

      <main id="jar" className="jar-main">
        {result.ok ? (
          <JarBody config={result.config} origin={origin} />
        ) : (
          <JarError reason={result.error} />
        )}
      </main>

      <footer className="site-footer">
        <p>{t("poweredBy")}</p>
        <p>
          <a href="/">{t("jarFooterCta")}</a>
        </p>
      </footer>
    </>
  );
}

// ── The valid jar: identity + suggested amounts + the live widget + the Chia story. ──────────────
function JarBody({ config, origin }: { config: JarConfig; origin: string }) {
  const t = useT();
  // Prefer an explicit CAT symbol override; else the asset's auto symbol (XCH / $DIG / CAT).
  const symbol = config.symbol?.trim() || assetSymbol(config.asset);
  const displayName = config.name?.trim() || null;
  const heading = displayName ? t("jarHeadingNamed").replace("{name}", displayName) : t("jarHeadingGeneric");
  const amounts = config.presets && config.presets.length ? config.presets : defaultPresetsFor(config.asset);

  // Per-page SEO/social meta (§6.6) — each jar URL is its own shareable page, so it gets its own
  // deterministic title + description + canonical + Open Graph, restored on unmount so SPA
  // navigation never leaves a stale card. All derived from the URL (no backend).
  useEffect(() => {
    const title = displayName
      ? t("jarMetaTitleNamed").replace("{name}", displayName).replace("{asset}", symbol)
      : t("jarMetaTitleGeneric").replace("{asset}", symbol);
    const who = displayName ? displayName : t("jarMetaWhoGeneric");
    const description = t("jarMetaDescription").replace("{who}", who).replace("{asset}", symbol);
    return applyMeta({ title, description, canonical: jarUrl(config, origin) });
  }, [config, origin, displayName, symbol, t]);

  return (
    <div className="jar-card" data-testid="jar-card">
      <p className="jar-eyebrow">{t("jarEyebrow")}</p>
      <h1 className="jar-heading">{heading}</h1>
      <p className="jar-sub">
        {t("jarSub")} <span data-testid="jar-asset" className="jar-asset">{symbol}</span>.
      </p>

      <JarAddress recipient={config.recipient} />

      {/* Suggested amounts (display-only echo of what the widget offers; the widget owns the flow). */}
      <ul className="jar-amounts" data-testid="jar-amounts" aria-label={t("jarAmountsLabel")}>
        {amounts.map((a) => (
          <li key={a} className="jar-amount">
            {String(a)} {symbol}
          </li>
        ))}
      </ul>

      {/* The real widget mounts here, preconfigured from the URL. */}
      <JarWidget config={config} />

      <p className="jar-note">{t("jarNote")}</p>
      <p className="jar-fee">{t("feeNote")}</p>

      {/* Why Chia — the honest value story (low fees, fast, self-custodial). */}
      <ul className="jar-benefits" data-testid="jar-benefits">
        <li>
          <strong>{t("jarBenefit1Title")}</strong>
          <span>{t("jarBenefit1Body")}</span>
        </li>
        <li>
          <strong>{t("jarBenefit2Title")}</strong>
          <span>{t("jarBenefit2Body")}</span>
        </li>
        <li>
          <strong>{t("jarBenefit3Title")}</strong>
          <span>{t("jarBenefit3Body")}</span>
        </li>
      </ul>
    </div>
  );
}

// The recipient identity chip: an elegant middle-truncation that copies the FULL address on click.
function JarAddress({ recipient }: { recipient: string }) {
  const t = useT();
  const { copied, copy } = useCopy(recipient);
  return (
    <button
      type="button"
      className="jar-address"
      data-testid="jar-address"
      data-copied={copied ? "true" : "false"}
      onClick={copy}
      title={recipient}
      aria-label={`${t("jarCopyAddress")}: ${recipient}`}
    >
      <span className="jar-address-to">{t("jarTo")}</span>
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
    if (config.symbol) script.setAttribute("data-symbol", config.symbol);
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
  const t = useT();
  return (
    <div className="jar-error" role="alert" data-testid="jar-error">
      <p className="jar-error-title">{t("jarErrorTitle")}</p>
      <p className="jar-error-body">{reason || t("jarErrorBody")}</p>
      <a className="jar-error-cta" href="/">
        {t("jarErrorCta")}
      </a>
    </div>
  );
}
