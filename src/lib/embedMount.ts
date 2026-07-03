// embedMount.ts — mounts the canonical embed widget (public/embed/xch-tip.js) into a container
// element as a real, dynamically-created <script data-*> tag — the SAME shape a consuming site's
// own copy-pasted snippet produces (see buildEmbedSnippet in embed.ts; this is its DOM-mounting
// counterpart). Shared by every surface that hosts a LIVE widget instance rather than just
// printing the snippet as text: the tip-jar page (JarPage) and the embed-preview route
// (EmbedPreviewPage, iframed by the hub's Developer-tab live preview).

import { EMBED_PATH } from "./constants";
import { assetToAttr, schemeAttr, type Asset } from "./embed";
import type { SchemeName } from "./schemes";

export interface EmbedMountOptions {
  recipient: string;
  asset: Asset;
  scheme: SchemeName;
  color: string | null;
  presets: number[] | null;
  label: string | null;
  symbol: string | null;
  name: string | null;
  /** Optional custom logo URL (validated by lib/logo.ts) shown instead of the built-in mark. */
  logo?: string | null;
  /** The widget style variant; omitted (falls back to the widget's own "button" default) when null/undefined. */
  variant?: string | null;
  /** Widget UI language (BCP-47); omitted defaults to the visitor's browser language. */
  locale?: string;
  /** `data-size` override — JarPage uses "lg"; the plain embed contract and embed-preview omit it. */
  size?: string;
  /** `data-target` CSS selector to mount into — JarPage targets its own container id. */
  target?: string;
}

/**
 * Mount the embed widget into `container` as a real `<script>` element (not `innerHTML` — matches
 * how a site's own copy-pasted snippet actually works, so this is a true live-widget preview, not
 * a mock). Returns a cleanup function that empties the container; call it from a `useEffect`
 * cleanup so re-renders (a config change) and unmounts never leave a stale/duplicate widget.
 */
export function mountEmbedWidget(container: HTMLElement, opts: EmbedMountOptions): () => void {
  const script = document.createElement("script");
  script.setAttribute("src", EMBED_PATH);
  script.async = true;
  script.setAttribute("data-recipient", opts.recipient);
  script.setAttribute("data-asset", assetToAttr(opts.asset));

  const sa = schemeAttr(opts.scheme, opts.color);
  script.setAttribute(sa.attr, sa.value);

  if (opts.presets && opts.presets.length) {
    script.setAttribute("data-amount-presets", opts.presets.join(","));
  }
  if (opts.label) script.setAttribute("data-label", opts.label);
  if (opts.symbol) script.setAttribute("data-symbol", opts.symbol);
  if (opts.variant) script.setAttribute("data-variant", opts.variant);
  if (opts.name) script.setAttribute("data-name", opts.name);
  if (opts.logo) script.setAttribute("data-logo", opts.logo);
  if (opts.locale) script.setAttribute("data-locale", opts.locale);
  if (opts.size) script.setAttribute("data-size", opts.size);
  if (opts.target) script.setAttribute("data-target", opts.target);

  container.appendChild(script);
  return () => {
    container.replaceChildren();
  };
}
