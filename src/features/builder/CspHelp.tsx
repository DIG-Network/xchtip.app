// CspHelp — a tasteful, collapsed-by-default disclosure next to the embed snippet: exactly which
// Content-Security-Policy directives a site owner needs to ADD (merge into their existing policy)
// so a dropped-in xch-tip.js widget can actually load + connect a wallet. Static content (the
// directive set is the same regardless of the recipient/asset/scheme being configured) — the
// single source of truth for the text is src/lib/embedCsp.ts (also mirrored in SPEC.md §8b).

import { CopyField } from "@/components/CopyField";
import { EMBED_CSP } from "@/lib/embedCsp";
import { useT } from "@/i18n/useT";

export function CspHelp() {
  const t = useT();
  return (
    <details className="path-more" data-testid="csp-help">
      <summary>{t("cspHeading")}</summary>
      <p className="output-help">{t("cspIntro")}</p>
      <CopyField
        value={EMBED_CSP}
        label={t("cspHeading")}
        multiline
        copyLabel={t("copyShort")}
        valueTestId="csp-snippet"
      />
      <ul className="csp-reasons">
        <li>
          <code>script-src</code> — {t("cspScriptSrc")}
        </li>
        <li>
          <code>style-src</code> — {t("cspStyleSrc")}
        </li>
        <li>
          <code>connect-src</code> — {t("cspConnectSrc")}
        </li>
        <li>
          <code>frame-src</code> — {t("cspFrameSrc")}
        </li>
      </ul>
      <p className="csp-merge-note">{t("cspMergeNote")}</p>
    </details>
  );
}
