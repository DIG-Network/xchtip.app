// TipButtonPreview — a presentational, non-interactive preview of the tip button the embed snippet
// will render. It paints with the SAME resolved scheme (gradient + shadow) the widget uses, so the
// builder's live preview matches the deployed button. Pure: typed props, no data fetching, no state.

import { resolveScheme, type SchemeName } from "@/lib/schemes";
import { defaultLabelFor, type Asset } from "@/lib/embed";

export interface TipButtonPreviewProps {
  scheme: SchemeName;
  /** The custom accent hex, used when scheme === "custom". */
  color: string | null;
  asset: Asset;
  /** Optional custom label; defaults to an asset-aware label. */
  label: string | null;
}

export function TipButtonPreview({ scheme, color, asset, label }: TipButtonPreviewProps) {
  const resolved = resolveScheme(scheme === "custom" ? color : scheme);
  const text = label && label.trim() ? label.trim() : defaultLabelFor(asset);

  return (
    <div className="preview-stage" data-testid="preview-stage">
      <button
        type="button"
        className="tip-btn-preview"
        data-testid="tip-button-preview"
        // Preview only — announce that it's a sample so AT users aren't misled into thinking it tips.
        aria-label={`Preview of the tip button: ${text}`}
        style={{
          background: `linear-gradient(135deg, ${resolved.gradientFrom} 0%, ${resolved.gradientTo} 100%)`,
          color: resolved.text,
          // A layered glow so the button reads as spotlit on the plinth: a tight ambient shadow for
          // depth + a wide scheme-colored halo. The halo hue matches the stage spotlight (§signature).
          boxShadow: `0 10px 30px ${resolved.shadow}, 0 2px 8px rgba(0,0,0,0.4)`,
        }}
      >
        <span aria-hidden="true" className="tip-btn-heart">
          ♥
        </span>
        {text}
      </button>
    </div>
  );
}
