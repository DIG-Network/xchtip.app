// BuilderPanel — the builder container. Owns the useBuilder hook and composes the form (inputs) with
// the live preview + snippet output + shareable links. Maps derived state → the presentational
// children; renders the error/empty/success states of the output region explicitly.

import type { CSSProperties } from "react";
import { useBuilder, type BuilderForm as Form } from "./useBuilder";
import { BuilderForm } from "./BuilderForm";
import { TipButtonPreview } from "./TipButtonPreview";
import { ShortLink } from "./ShortLink";
import { CopyField } from "@/components/CopyField";
import { parseAsset } from "@/lib/embed";
import { resolveScheme } from "@/lib/schemes";
import { DIG_ASSET_ID } from "@/lib/constants";
import { S } from "@/lib/strings";

export interface BuilderPanelProps {
  /** Seed form (e.g. from query params). */
  initialForm?: Form;
  /** Origin for generated links (defaults to production; overridable in tests/preview). */
  origin?: string;
}

export function BuilderPanel({ initialForm, origin }: BuilderPanelProps) {
  const { form, derived, setField, applyXchPreset, applyDigPreset } = useBuilder(initialForm, origin);

  // The asset for the preview: parse the current selection (fall back to XCH so the preview always
  // renders a valid button, even mid-edit before a CAT id is complete).
  const previewAsset =
    parseAsset(
      form.assetChoice === "xch" ? "xch" : form.assetChoice === "dig" ? DIG_ASSET_ID : form.catId,
    ) ?? { kind: "xch" };

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
      {/* Hero stage — the live button on a spotlit plinth (the page's thesis). */}
      <section className="stage" style={stageStyle} aria-label="Live tip button preview">
        <div className="stage-spot">
          <h2 className="sr-only">{S.previewHeading}</h2>
          <TipButtonPreview
            scheme={form.scheme}
            color={form.color}
            asset={previewAsset}
            label={form.label}
          />
        </div>
        <p className="stage-caption">{S.stageCaption}</p>
      </section>

      <div className="builder-panel">
        <section className="builder-inputs" aria-label="Configure the tip button">
          <p className="eyebrow">{S.configureEyebrow}</p>
          <BuilderForm
            form={form}
            errors={derived.errors}
            setField={setField}
            applyXchPreset={applyXchPreset}
            applyDigPreset={applyDigPreset}
          />
        </section>

        <section className="builder-output" aria-label="Share and embed options">
          <p className="eyebrow">{S.embedEyebrow}</p>

          {/* Simplest path first: a ready-to-share hosted tip page (no embedding needed). */}
          {derived.ok && derived.jarLink && (
            <div className="output-block">
              <h2 className="output-heading">{S.jarLinkHeading}</h2>
              <p className="output-help">{S.jarLinkHelp}</p>
              <CopyField value={derived.jarLink} label={S.jarLinkLabel} valueTestId="jar-link" />
            </div>
          )}

          {/* Optional: shorten it to a *.xchtip.app link (hidden if the service isn't configured). */}
          {derived.ok && derived.jarLink && <ShortLink target={derived.jarLink} />}

          <div className="output-block">
            <h2 className="output-heading">{S.snippetHeading}</h2>
            <p className="output-help">{S.snippetHelp}</p>
            {derived.ok && derived.snippet ? (
              <CopyField
                value={derived.snippet}
                label={S.snippetHeading}
                multiline
                valueTestId="snippet-output"
              />
            ) : (
              <p className="output-empty" role="status" data-testid="snippet-blocked">
                {S.fixErrors}
              </p>
            )}
          </div>

          {derived.ok && derived.builderLink && derived.rawLink && (
            <div className="output-block">
              <h2 className="output-heading">{S.linkHeading}</h2>
              <p className="output-help">{S.linkHelp}</p>
              <CopyField value={derived.builderLink} label={S.linkHeading} valueTestId="builder-link" />
              <CopyField value={derived.rawLink} label={S.rawLinkLabel} valueTestId="raw-link" />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
