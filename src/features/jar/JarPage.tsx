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

import { useEffect, useMemo, useRef } from "react";
import type { JarParseResult, JarConfig } from "@/lib/jar";
import { jarUrl, ogImageUrl } from "@/lib/jar";
import { assetSymbol, defaultPresetsFor } from "@/lib/embed";
import { mountEmbedWidget } from "@/lib/embedMount";
import { applyMeta } from "@/lib/meta";
import { resolveScheme, schemeCssVars } from "@/lib/schemes";
import { useCopy } from "@/components/useCopy";
import { AssetGlyph } from "@/components/AssetGlyph";
import { SITE_ORIGIN } from "@/lib/constants";
import { useT } from "@/i18n/useT";
import { useLocale } from "@/i18n/I18nProvider";
import { APP_VERSION } from "@/lib/version";

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

  // Theme the WHOLE page — background, header, card surfaces, borders, muted text — to the
  // selected scheme's derived surface palette (lib/schemes.ts, the SAME resolveScheme() the
  // builder's stage glow and the widget itself paint with): a DIG jar reads purple end-to-end
  // (dark-violet base + violet-tinted surfaces), an HOA jar warm orange, XCH green. The vars go
  // on <body> so the `body.jar-page` token remap in styles.css re-points the site's base tokens
  // (--ink/--well/--line/--paper-dim/…) at them — every surface re-themes, no per-rule forking.
  // The invalid-jar error page themes to the green default (fail-safe, matches resolveScheme).
  const resolved = useMemo(
    () =>
      resolveScheme(
        result.ok ? (result.config.scheme === "custom" ? result.config.color : result.config.scheme) : null,
      ),
    [result],
  );
  useEffect(() => {
    const body = document.body;
    const vars = schemeCssVars(resolved);
    body.classList.add("jar-page");
    for (const [name, value] of Object.entries(vars)) body.style.setProperty(name, value);
    return () => {
      // Restore a clean body on unmount so SPA navigation never leaks the tint elsewhere.
      body.classList.remove("jar-page");
      for (const name of Object.keys(vars)) body.style.removeProperty(name);
    };
  }, [resolved]);

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
        <p className="footer-version" data-testid="app-version">
          {t("versionLabel", { version: APP_VERSION })}
        </p>
      </footer>
    </>
  );
}

// ── The valid jar: identity + suggested amounts + the live widget + the Chia story. ──────────────
function JarBody({ config, origin }: { config: JarConfig; origin: string }) {
  const t = useT();
  const { locale } = useLocale();
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
    // A PERSONALIZED per-recipient card (#221) — the SAME color/logo the widget below paints with,
    // rendered server-side by the /og Lambda so crawlers (which never run this component's JS) see
    // it too. See lib/ogCard.ts.
    return applyMeta({ title, description, canonical: jarUrl(config, origin), image: ogImageUrl(config, origin) });
  }, [config, origin, displayName, symbol, t]);

  return (
    <div className="jar-card" data-testid="jar-card">
      <p className="jar-eyebrow">{t("jarEyebrow")}</p>
      <h1 className="jar-heading">{heading}</h1>
      <p className="jar-sub">
        {t("jarSub")}{" "}
        <span data-testid="jar-asset" className="jar-asset">
          {symbol}
        </span>
        .
      </p>

      {/* The coin hero mark — the asset's logo as a prominent, centered medallion under the intro
          copy (custom `logo` URL > built-in DIG/HOA/XCH mark > text initial — the SAME
          resolveAssetGlyph precedence as everywhere else). Decorative: the asset is already named
          in the "Paid in <asset>" line above, so the block is aria-hidden. */}
      <div className="jar-coin" data-testid="jar-coin" aria-hidden="true">
        <AssetGlyph asset={config.asset} symbol={symbol} logo={config.logo} className="jar-coin-mark" size={100} />
      </div>

      {/* Optional display name — the prominent, human-readable recipient identity, shown ABOVE the
          full address. It is rendered as a React text node (inert; never parsed as HTML) and was
          hard-sanitized on parse (length-capped, control-chars stripped). The FULL address below
          stays visible so a lookalike name can never mask who is actually paid (anti-spoofing). */}
      {displayName && (
        <p className="jar-name" data-testid="jar-name">
          {displayName}
        </p>
      )}

      <JarAddress recipient={config.recipient} />

      {/* Suggested amounts (display-only echo of what the widget offers; the widget owns the flow). */}
      <ul className="jar-amounts" data-testid="jar-amounts" aria-label={t("jarAmountsLabel")}>
        {amounts.map((a) => (
          <li key={a} className="jar-amount">
            {String(a)} {symbol}
          </li>
        ))}
      </ul>

      {/* The real widget mounts here, preconfigured from the URL (including the display name). */}
      <JarWidget config={config} locale={locale} />

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

// The recipient identity chip: shows the FULL address (never truncated — truncation would let an
// attacker pass off a lookalike address that matches the visible head+tail) and copies it on click.
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
      <code className="jar-address-full">{recipient}</code>
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
function JarWidget({ config, locale }: { config: JarConfig; origin?: string; locale: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // A tip PAGE wants a prominent button (data-size="lg") + the page's active locale, mounted
    // into its own target container. See lib/embedMount.ts for the shared mounting contract.
    return mountEmbedWidget(mount, {
      recipient: config.recipient,
      asset: config.asset,
      scheme: config.scheme,
      color: config.color,
      presets: config.presets,
      label: config.label,
      symbol: config.symbol,
      name: config.name,
      logo: config.logo,
      locale,
      size: "lg",
      target: `#${WIDGET_MOUNT_ID}`,
    });
  }, [config, locale]);

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
