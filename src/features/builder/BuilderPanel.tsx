// BuilderPanel — the builder container. Owns the useBuilder hook and composes the form (inputs) with
// the live preview + snippet output + shareable links. Maps derived state → the presentational
// children; renders the error/empty/success states of the output region explicitly.

import type { CSSProperties } from "react";
import { useBuilder, type BuilderForm as Form } from "./useBuilder";
import { BuilderForm } from "./BuilderForm";
import { LiveWidgetPreview } from "./LiveWidgetPreview";
import { ShortLink } from "./ShortLink";
import { CopyField } from "@/components/CopyField";
import { resolveScheme } from "@/lib/schemes";
import { useT } from "@/i18n/useT";

export interface BuilderPanelProps {
  /** Seed form (e.g. from query params). */
  initialForm?: Form;
  /** Origin for generated links (defaults to production; overridable in tests/preview). */
  origin?: string;
}

export function BuilderPanel({ initialForm, origin }: BuilderPanelProps) {
  const t = useT();
  const { form, derived, setField, applyXchPreset, applyDigPreset, applyHoaPreset } = useBuilder(initialForm, origin);

  // Signature moment: the plinth's spotlight + the button's reflection take the ACTIVE scheme's hue,
  // so choosing green / purple / a custom color literally re-lights the stage. Derived from the same
  // resolveScheme the button paints with, exposed to CSS via custom properties on the stage.
  const resolved = resolveScheme(form.scheme === "custom" ? form.color : form.scheme);
  const stageStyle = {
    "--stage-glow": resolved.shadow,
    "--stage-glow-soft": resolved.shadow,
  } as CSSProperties;

  return (
    <>
      {/* Hero stage — the REAL, working tip widget on a spotlit plinth (the page's thesis). It is
          grayed out + inert until a valid recipient makes a real snippet. */}
      <section className="stage" style={stageStyle} aria-label="Live tip button preview">
        <div className="stage-spot">
          <h2 className="sr-only">{t("previewHeading")}</h2>
          <LiveWidgetPreview snippet={derived.ok ? derived.snippet : null} />
        </div>
        <p className="stage-caption">{derived.ok ? t("stageCaption") : t("stageCaptionDisabled")}</p>
        <p className="stage-fee">{t("feeNote")}</p>
      </section>

      <div className="builder-panel">
        <section className="builder-inputs" aria-label="Configure the tip button">
          <p className="eyebrow">{t("configureEyebrow")}</p>
          <BuilderForm
            form={form}
            errors={derived.errors}
            setField={setField}
            applyXchPreset={applyXchPreset}
            applyDigPreset={applyDigPreset}
            applyHoaPreset={applyHoaPreset}
          />
        </section>

        <section className="builder-output" aria-label="Ways to share your tip button">
          <p className="eyebrow">{t("embedEyebrow")}</p>

          {/* TWO equally-prominent audience paths so a non-developer and a developer each see, at a
              glance, the option meant for them. Path 1 (everyone) = a hosted tip page; Path 2
              (developers) = the embed snippet. Both are shown up-front, side by side on wide screens. */}
          <div className="path-grid">
            {/* Path 1 — the tip PAGE (for anyone). Marked primary: the no-code path. */}
            <div className="path-card path-card-primary" data-testid="path-page">
              <div className="path-head">
                <span className="path-audience">{t("pathPageAudience")}</span>
                <h2 className="path-title">{t("pathPageTitle")}</h2>
              </div>
              <p className="path-desc">{t("pathPageDesc")}</p>
              {derived.ok && derived.jarLink ? (
                <>
                  <CopyField
                    value={derived.jarLink}
                    label={t("jarLinkLabel")}
                    copyLabel={t("copyShort")}
                    valueTestId="jar-link"
                  />
                  <a
                    className="path-cta"
                    href={derived.jarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="jar-visit"
                  >
                    {t("visitButton")}
                  </a>
                  <ShortLink target={derived.jarLink} />
                </>
              ) : (
                <p className="output-empty" role="status" data-testid="page-blocked">
                  {t("fixErrors")}
                </p>
              )}
            </div>

            {/* Path 2 — the EMBED snippet (for developers). */}
            <div className="path-card" data-testid="path-embed">
              <div className="path-head">
                <span className="path-audience">{t("pathEmbedAudience")}</span>
                <h2 className="path-title">{t("pathEmbedTitle")}</h2>
              </div>
              <p className="path-desc">{t("pathEmbedDesc")}</p>
              {derived.ok && derived.snippet ? (
                <>
                  <CopyField
                    value={derived.snippet}
                    label={t("snippetHeading")}
                    multiline
                    valueTestId="snippet-output"
                  />
                  {derived.builderLink && derived.rawLink && (
                    <details className="path-more">
                      <summary>{t("linkHeading")}</summary>
                      <p className="output-help">{t("linkHelp")}</p>
                      <CopyField value={derived.builderLink} label={t("linkHeading")} valueTestId="builder-link" />
                      <CopyField value={derived.rawLink} label={t("rawLinkLabel")} valueTestId="raw-link" />
                    </details>
                  )}
                </>
              ) : (
                <p className="output-empty" role="status" data-testid="snippet-blocked">
                  {t("fixErrors")}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
