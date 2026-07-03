// LiveWidgetPreview — the builder's live preview IS the real embed widget.
//
// Instead of a static mock, this mounts the actual /embed/xch-tip.js widget with the exact snippet
// the user will copy, so what they see is a fully working tip button (connect a wallet, pick an
// amount, sign — the real flow). Until a valid snippet exists (no/invalid recipient), the stage is
// GRAYED OUT and disabled (aria-disabled), with no widget mounted — an explicit "empty/disabled"
// state so the preview never lies about being interactive.
//
// A <script> inserted via innerHTML does NOT execute; we parse the snippet's attributes and build a
// real <script> element so the browser runs it. The widget is re-mounted whenever the snippet changes
// (any config edit) and torn down when the config goes invalid.

import { useEffect, useRef } from "react";
import { useT } from "@/i18n/useT";

export interface LiveWidgetPreviewProps {
  /** The exact embed snippet to mount, or null when the config is invalid (disabled state). */
  snippet: string | null;
}

// Parse `<script src=… data-*=… async></script>` into [name, value] attribute pairs. Returns null
// if the string isn't a single script tag. Uses the DOM parser (no regex fragility).
function parseScriptAttrs(snippet: string): Array<[string, string]> | null {
  const doc = new DOMParser().parseFromString(snippet, "text/html");
  const el = doc.querySelector("script");
  if (!el) return null;
  const out: Array<[string, string]> = [];
  for (const attr of Array.from(el.attributes)) out.push([attr.name, attr.value]);
  return out;
}

export function LiveWidgetPreview({ snippet }: LiveWidgetPreviewProps) {
  const t = useT();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const active = snippet != null && snippet.trim() !== "";

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Always start from a clean mount (also tears down a previous widget instance on re-render).
    mount.replaceChildren();
    if (!active || !snippet) return;

    const attrs = parseScriptAttrs(snippet);
    if (!attrs) return;

    // Reset the widget's one-time global so each preview mount re-boots + re-injects styles cleanly.
    try {
      (window as unknown as { __xchTip?: unknown }).__xchTip = undefined;
    } catch {
      /* ignore */
    }

    const script = document.createElement("script");
    for (const [name, value] of attrs) {
      if (name === "async") {
        script.async = true;
      } else if (name === "src") {
        // Load the SAME-ORIGIN widget so the preview reflects THIS build (not whatever is live on
        // xchtip.app), keeps working on any preview host, and needs no cross-origin fetch.
        try {
          script.setAttribute("src", new URL(value, window.location.origin).pathname);
        } catch {
          script.setAttribute("src", value);
        }
      } else {
        script.setAttribute(name, value);
      }
    }
    mount.appendChild(script);

    return () => {
      mount.replaceChildren();
    };
  }, [snippet, active]);

  return (
    <div
      className="live-widget"
      data-testid="live-widget"
      data-active={active ? "true" : "false"}
      aria-disabled={active ? "false" : "true"}
    >
      <div ref={mountRef} className="live-widget-mount" aria-hidden={active ? undefined : "true"} />
      {!active && (
        <p className="live-widget-hint" role="status">
          {t("stageCaptionDisabled")}
        </p>
      )}
    </div>
  );
}
