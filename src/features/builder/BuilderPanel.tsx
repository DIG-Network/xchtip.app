// BuilderPanel — the builder container. Owns the useBuilder hook and composes the form (inputs) with
// the live preview + snippet output + shareable links. Maps derived state → the presentational
// children; renders the error/empty/success states of the output region explicitly.

import { useBuilder, type BuilderForm as Form } from "./useBuilder";
import { BuilderForm } from "./BuilderForm";
import { TipButtonPreview } from "./TipButtonPreview";
import { CopyField } from "@/components/CopyField";
import { parseAsset } from "@/lib/embed";
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

  return (
    <div className="builder-panel">
      <section className="builder-inputs" aria-label="Builder inputs">
        <BuilderForm
          form={form}
          errors={derived.errors}
          setField={setField}
          applyXchPreset={applyXchPreset}
          applyDigPreset={applyDigPreset}
        />
      </section>

      <section className="builder-output" aria-label="Preview and embed code">
        <div className="output-block">
          <h2 className="output-heading">{S.previewHeading}</h2>
          <TipButtonPreview
            scheme={form.scheme}
            color={form.color}
            asset={previewAsset}
            label={form.label}
          />
        </div>

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
  );
}
