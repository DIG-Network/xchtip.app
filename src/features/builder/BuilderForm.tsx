// BuilderForm — the presentational input surface for the builder. Takes the form state + errors +
// typed setters (owned by useBuilder) and renders labelled, accessible controls: recipient, asset
// (radio: XCH / $DIG / other CAT + a CAT-id field), scheme (radio: green / purple / custom + a color
// picker), presets, label, and the two one-click presets. No data fetching, no derivation here.

import type { BuilderForm as Form, AssetChoice } from "./useBuilder";
import type { ValidationErrors, WidgetVariant } from "@/lib/embed";
import { useCatSymbol } from "./useCatSymbol";
import { useT } from "@/i18n/useT";

export interface BuilderFormProps {
  form: Form;
  errors: ValidationErrors;
  setField: <K extends keyof Form>(key: K, value: Form[K]) => void;
  applyXchPreset: () => void;
  applyDigPreset: () => void;
  applyHoaPreset: () => void;
}

export function BuilderForm({ form, errors, setField, applyXchPreset, applyDigPreset, applyHoaPreset }: BuilderFormProps) {
  const t = useT();
  // Auto-detect the CAT symbol for an "Other CAT" asset (a suggestion; the manual field overrides).
  const catSymbol = useCatSymbol(form.catId, form.assetChoice === "cat");
  return (
    <form className="builder-form" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Tip widget builder">
      {/* One-click presets */}
      <div className="preset-row" role="group" aria-label="Quick presets">
        <button type="button" className="preset-btn preset-xch" onClick={applyXchPreset} data-testid="preset-xch">
          {t("presetXchButton")}
        </button>
        <button type="button" className="preset-btn preset-dig" onClick={applyDigPreset} data-testid="preset-dig">
          {t("presetDigButton")}
        </button>
        <button type="button" className="preset-btn preset-hoa" onClick={applyHoaPreset} data-testid="preset-hoa">
          {t("presetHoaButton")}
        </button>
      </div>

      {/* Recipient */}
      <div className="field">
        <label htmlFor="recipient" className="field-label">
          {t("recipientLabel")}
        </label>
        <p id="recipient-help" className="field-help">
          {t("recipientHelp")}
        </p>
        <input
          id="recipient"
          type="text"
          className="field-input"
          data-testid="input-recipient"
          value={form.recipient}
          placeholder={t("recipientPlaceholder")}
          onChange={(e) => setField("recipient", e.target.value)}
          aria-describedby={errors.recipient ? "recipient-help recipient-error" : "recipient-help"}
          aria-invalid={errors.recipient ? true : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {errors.recipient && (
          <p id="recipient-error" className="field-error" role="alert" data-testid="error-recipient">
            {errors.recipient}
          </p>
        )}
      </div>

      {/* Asset */}
      <fieldset className="field">
        <legend className="field-label">{t("assetLabel")}</legend>
        <div className="radio-row" role="radiogroup" aria-label={t("assetLabel")}>
          {(
            [
              ["xch", t("assetXch")],
              ["dig", t("assetDig")],
              ["hoa", t("assetHoa")],
              ["cat", t("assetCustomCat")],
            ] as [AssetChoice, string][]
          ).map(([value, text]) => (
            <label key={value} className="radio-chip">
              <input
                type="radio"
                name="asset"
                value={value}
                checked={form.assetChoice === value}
                onChange={() => setField("assetChoice", value)}
                data-testid={`asset-${value}`}
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
        {form.assetChoice === "cat" && (
          <div className="subfield">
            <label htmlFor="catId" className="field-label">
              {t("catIdLabel")}
            </label>
            <p id="catId-help" className="field-help">
              {t("catIdHelp")}
            </p>
            <input
              id="catId"
              type="text"
              className="field-input"
              data-testid="input-catid"
              value={form.catId}
              placeholder={t("catIdPlaceholder")}
              onChange={(e) => setField("catId", e.target.value)}
              aria-describedby="catId-help"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Token symbol — auto-detected from the asset id, overridable. Loading + detected states. */}
            <label htmlFor="symbol" className="field-label">
              {t("symbolLabel")}
            </label>
            <p id="symbol-help" className="field-help">
              {t("symbolHelp")}
            </p>
            <input
              id="symbol"
              type="text"
              className="field-input"
              data-testid="input-symbol"
              value={form.symbol}
              placeholder={catSymbol.detected ?? t("symbolPlaceholder")}
              onChange={(e) => setField("symbol", e.target.value)}
              aria-describedby="symbol-help symbol-status"
              autoComplete="off"
              spellCheck={false}
            />
            <p id="symbol-status" className="field-help" role="status" data-testid="symbol-status">
              {catSymbol.detecting
                ? t("symbolDetecting")
                : !form.symbol.trim() && catSymbol.detected
                  ? `${t("symbolDetected")}${catSymbol.detected}`
                  : ""}
            </p>
          </div>
        )}
        {errors.asset && (
          <p className="field-error" role="alert" data-testid="error-asset">
            {errors.asset}
          </p>
        )}
      </fieldset>

      {/* Scheme */}
      <fieldset className="field">
        <legend className="field-label">{t("schemeLabel")}</legend>
        <div className="radio-row" role="radiogroup" aria-label={t("schemeLabel")}>
          {(
            [
              ["green", t("schemeGreen")],
              ["purple", t("schemePurple")],
              ["orange", t("schemeOrange")],
              ["custom", t("schemeCustom")],
            ] as [Form["scheme"], string][]
          ).map(([value, text]) => (
            <label key={value} className="radio-chip">
              <input
                type="radio"
                name="scheme"
                value={value}
                checked={form.scheme === value}
                onChange={() => setField("scheme", value)}
                data-testid={`scheme-${value}`}
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
        {form.scheme === "custom" && (
          <div className="subfield">
            <label htmlFor="color" className="field-label">
              {t("colorLabel")}
            </label>
            <p id="color-help" className="field-help">
              {t("colorHelp")}
            </p>
            <div className="color-row">
              <input
                id="color"
                type="color"
                className="color-swatch"
                data-testid="input-color-swatch"
                value={/^#[0-9a-f]{6}$/i.test(form.color) ? form.color : "#7a3dff"}
                onChange={(e) => setField("color", e.target.value)}
                aria-label={`${t("colorLabel")} (swatch)`}
              />
              <input
                type="text"
                className="field-input color-text"
                data-testid="input-color-text"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                aria-label={`${t("colorLabel")} (hex)`}
                aria-describedby={errors.color ? "color-help color-error" : "color-help"}
                aria-invalid={errors.color ? true : undefined}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {errors.color && (
              <p id="color-error" className="field-error" role="alert" data-testid="error-color">
                {errors.color}
              </p>
            )}
          </div>
        )}
      </fieldset>

      {/* Presets */}
      <div className="field">
        <label htmlFor="presets" className="field-label">
          {t("presetsLabel")}
        </label>
        <p id="presets-help" className="field-help">
          {t("presetsHelp")}
        </p>
        <input
          id="presets"
          type="text"
          className="field-input"
          data-testid="input-presets"
          value={form.presets}
          placeholder="1,5,25"
          onChange={(e) => setField("presets", e.target.value)}
          aria-describedby="presets-help"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Widget style variant */}
      <fieldset className="field">
        <legend className="field-label">{t("variantLabel")}</legend>
        <p className="field-help">{t("variantHelp")}</p>
        <div className="radio-row" role="radiogroup" aria-label={t("variantLabel")}>
          {(
            [
              ["button", t("variantButton")],
              ["compact", t("variantCompact")],
              ["pill", t("variantPill")],
              ["inline", t("variantInline")],
              ["banner", t("variantBanner")],
              ["card", t("variantCard")],
            ] as [WidgetVariant, string][]
          ).map(([value, text]) => (
            <label key={value} className="radio-chip">
              <input
                type="radio"
                name="variant"
                value={value}
                checked={form.variant === value}
                onChange={() => setField("variant", value)}
                data-testid={`variant-${value}`}
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Label */}
      <div className="field">
        <label htmlFor="label" className="field-label">
          {t("labelLabel")}
        </label>
        <input
          id="label"
          type="text"
          className="field-input"
          data-testid="input-label"
          value={form.label}
          placeholder={t("labelPlaceholder")}
          onChange={(e) => setField("label", e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Display name — shown on the shareable tip page (does not affect the embed button). */}
      <div className="field">
        <label htmlFor="name" className="field-label">
          {t("jarNameLabel")}
        </label>
        <p id="name-help" className="field-help">
          {t("jarNameHelp")}
        </p>
        <input
          id="name"
          type="text"
          className="field-input"
          data-testid="input-name"
          value={form.name}
          placeholder={t("jarNamePlaceholder")}
          onChange={(e) => setField("name", e.target.value)}
          aria-describedby="name-help"
          autoComplete="off"
        />
      </div>
    </form>
  );
}
