// jar.ts — the DETERMINISTIC tip-jar page URL contract (pure; no DOM, no server state).
//
// A tip jar is a fully pre-configured landing page for one recipient (+ asset + look). The URL IS
// the state: `/jar/<recipient>` with the config in a CANONICAL query string, so the same config
// always yields the identical URL and anyone can construct or share one with no backend. The SPA
// (and the CloudFront 403/404→index.html SPA fallback) renders it.
//
// Canonical form (SPEC.md §Tip jar pages) — parameters appear in this FIXED order, and defaults
// are OMITTED so equivalent configs can never mint two different URLs:
//   /jar/<recipient>                     recipient: lowercase bech32m xch address (path segment)
//     ?asset=<catId>                     only when the asset is a CAT (omitted for XCH)
//     &scheme=purple                     only for the named purple scheme (green is the default)
//     &color=%23rrggbb                   only for a custom accent (implies scheme=custom)
//     &presets=<a,b,c>                   only when custom amount presets are set
//     &label=<text>                      only when a custom button label is set
//     &name=<text>                       only when a display name for the page is set
//
// Round-trip law (tested): parseJarPath(jarPath(c)) yields c, and jarPath(parse(url)) re-yields
// the same url byte-for-byte.

import { SITE_ORIGIN } from "./constants";
import { validateConfig, assetToAttr, type Asset } from "./embed";
import type { SchemeName } from "./schemes";

/** The full config a tip-jar page renders from (a TipConfig plus the page display name). */
export interface JarConfig {
  /** Recipient Chia bech32m address (canonical lowercase). */
  recipient: string;
  /** The asset tips are paid in. */
  asset: Asset;
  /** The color scheme (`green` | `purple` | `custom`). */
  scheme: SchemeName;
  /** The custom accent hex (`#rrggbb`), present only when scheme === "custom". */
  color: string | null;
  /** Custom amount presets, or null for the asset defaults. */
  presets: number[] | null;
  /** Custom tip-button label, or null for the asset default. */
  label: string | null;
  /** Optional display symbol for a CAT (overrides auto-detection), or null. */
  symbol: string | null;
  /** Display name shown on the jar page heading, or null. */
  name: string | null;
}

/** Result of parsing a would-be jar URL: a config, or a human-readable reason it is invalid. */
export type JarParseResult = { ok: true; config: JarConfig } | { ok: false; error: string };

/** True when a pathname addresses the jar route at all (valid or not). */
export function isJarPath(pathname: string): boolean {
  return /^\/jar(\/|$)/.test(pathname);
}

/**
 * jarPath — the canonical path+query for a JarConfig. Deterministic: fixed parameter order,
 * defaults omitted, recipient + asset id + color lowercased.
 */
export function jarPath(config: JarConfig): string {
  const p = new URLSearchParams();
  if (config.asset.kind === "cat") p.set("asset", config.asset.assetId.toLowerCase());
  if (config.scheme === "purple") p.set("scheme", "purple");
  if (config.scheme === "custom" && config.color) p.set("color", config.color.toLowerCase());
  if (config.presets && config.presets.length) p.set("presets", config.presets.join(","));
  if (config.label) p.set("label", config.label);
  if (config.symbol) p.set("symbol", config.symbol);
  if (config.name) p.set("name", config.name);
  const q = p.toString();
  return `/jar/${config.recipient.toLowerCase()}${q ? `?${q}` : ""}`;
}

/** jarPath with an origin prefix (defaults to production) — the shareable absolute URL. */
export function jarUrl(config: JarConfig, origin: string = SITE_ORIGIN): string {
  return `${String(origin || SITE_ORIGIN).replace(/\/+$/, "")}${jarPath(config)}`;
}

/**
 * parseJarPath — parse a location (pathname + search) into a JarConfig.
 *   • null            → not a jar route at all (the caller routes elsewhere).
 *   • { ok: false }   → a jar route with an invalid/missing recipient or params (render the
 *                       jar error state).
 *   • { ok: true }    → the validated, canonicalized config (round-trips through jarPath).
 * Tolerates a trailing slash and an uppercase recipient (canonicalizes to lowercase); ignores
 * unknown query params (forward-compatible).
 */
export function parseJarPath(pathname: string, search: string | URLSearchParams): JarParseResult | null {
  if (!isJarPath(pathname)) return null;

  const rest = pathname.replace(/^\/jar\/?/, "").replace(/\/+$/, "");
  const recipient = decodeURIComponent(rest).trim().toLowerCase();
  if (!recipient) {
    return { ok: false, error: "This tip jar link is missing its recipient address." };
  }

  const q = typeof search === "string" ? new URLSearchParams(search) : search;
  const result = validateConfig({
    recipient,
    asset: q.get("asset") ?? "xch",
    scheme: q.get("scheme") ?? undefined,
    color: q.get("color") ?? undefined,
    presets: q.get("presets") ?? undefined,
    label: q.get("label") ?? undefined,
    symbol: q.get("symbol") ?? undefined,
  });
  if (!result.ok) {
    const messages = [result.errors.recipient, result.errors.asset, result.errors.color].filter(Boolean);
    return { ok: false, error: messages.join(" ") || "This tip jar link is invalid." };
  }

  const name = (q.get("name") ?? "").trim();
  return {
    ok: true,
    config: {
      recipient: result.config.recipient,
      asset: result.config.asset,
      scheme: result.config.scheme,
      color: result.config.color,
      presets: result.config.presets,
      label: result.config.label,
      symbol: result.config.symbol,
      name: name === "" ? null : name,
    },
  };
}

/** The `data-asset` attribute value for the jar's asset (re-exported convenience). */
export function jarAssetAttr(config: JarConfig): string {
  return assetToAttr(config.asset);
}
