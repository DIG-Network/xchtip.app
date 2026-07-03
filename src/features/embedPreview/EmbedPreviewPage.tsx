// EmbedPreviewPage — the chromeless `/embed-preview` route. Renders ONLY the live embed widget for
// the given query params, on a transparent background: no header/footer/hero, no site chrome at
// all. Built for the hub's Developer-tab "Embeddable Tip button" panel to
// `<iframe src="https://xchtip.app/embed-preview?…">` so it gets a REAL, isolated live preview of
// the widget — no hub CSP/JS/WalletConnect entanglement, and none of xchtip's own site chrome
// bleeding into a small embedded preview.
//
// Query params (SPEC.md §6b) mirror the jar/builder contract (see lib/embed.ts validateConfig):
//   recipient   REQUIRED  — the tip recipient's bech32m Chia address
//   asset       optional  — "xch" (default) or a 64-hex CAT asset id
//   scheme      optional  — "green" (default) | "purple" | "orange" | a 6-hex custom color
//   name        optional  — recipient display name, sanitized identically to the jar page
//   logo        optional  — a custom logo URL, shown instead of the built-in mark (lib/logo.ts)
// (color/presets/label/symbol/variant are also accepted, for parity with the full snippet
// contract, but are not part of the documented hub integration — see README/llms.txt.)
//
// On invalid/incomplete params the page renders NOTHING (a blank, transparent stage) rather than
// an error: the hub updates the iframe `src` reactively as the user edits the form, so a mid-edit
// invalid state (e.g. a half-typed address) is expected and should be visually silent, not an
// error flash inside a small preview box.
//
// The route is served by the same CloudFront SPA fallback as every other client route (§ terraform
// main.tf default_cache_behavior → html_open: no X-Frame-Options, no frame-ancestors CSP) — it is
// frameable by design, matching the widget's own embed-anywhere posture.

import { useEffect, useMemo, useRef } from "react";
import { validateConfig, type TipConfig } from "@/lib/embed";
import { mountEmbedWidget } from "@/lib/embedMount";
import { useLocale } from "@/i18n/I18nProvider";

export interface EmbedPreviewPageProps {
  /** The URL search string (query params only — this route takes no path segment). */
  search: string | URLSearchParams;
}

export function EmbedPreviewPage({ search }: EmbedPreviewPageProps) {
  const { locale } = useLocale();

  // Transparent, chromeless background so the widget blends into whatever page/iframe embeds it —
  // toggled on this route only (never affects the builder/jar pages' own dark surface).
  useEffect(() => {
    document.body.classList.add("embed-preview-page");
    return () => document.body.classList.remove("embed-preview-page");
  }, []);

  const q = useMemo(() => (typeof search === "string" ? new URLSearchParams(search) : search), [search]);
  const result = useMemo(
    () =>
      validateConfig({
        recipient: q.get("recipient"),
        asset: q.get("asset") ?? "xch",
        scheme: q.get("scheme"),
        color: q.get("color"),
        presets: q.get("presets"),
        label: q.get("label"),
        symbol: q.get("symbol"),
        variant: q.get("variant"),
        name: q.get("name"),
        logo: q.get("logo"),
      }),
    [q],
  );

  return (
    <div className="embed-preview-stage" data-testid="embed-preview-stage">
      {result.ok ? <EmbedPreviewWidget config={result.config} locale={locale} /> : null}
    </div>
  );
}

// Mounts the real embed widget (the SAME live instance the jar page and a consuming site's own
// snippet mount — see lib/embedMount.ts), keyed to remount cleanly whenever the config changes.
function EmbedPreviewWidget({ config, locale }: { config: TipConfig; locale: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    return mountEmbedWidget(mount, {
      recipient: config.recipient,
      asset: config.asset,
      scheme: config.scheme,
      color: config.color,
      presets: config.presets,
      label: config.label,
      symbol: config.symbol,
      variant: config.variant,
      name: config.name,
      logo: config.logo,
      locale,
    });
  }, [config, locale]);

  return <div className="embed-preview-widget" data-testid="embed-preview-widget" ref={mountRef} />;
}
