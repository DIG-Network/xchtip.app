// useBuilder — the builder's stateful logic hook. Owns the raw form inputs, derives the validated
// config + embed snippet + shareable link, and exposes typed setters. All validation/derivation is
// delegated to the pure lib/embed functions (the tested single source of truth); this hook is only
// the React state wiring.

import { useMemo, useState, useCallback } from "react";
import {
  buildSnippetFromInput,
  parseQueryParams,
  hasBuilderParams,
  parseVariant,
  type ValidationErrors,
  type WidgetVariant,
} from "@/lib/embed";
import { jarUrl } from "@/lib/jar";
import { SITE_ORIGIN } from "@/lib/constants";
import { DIG_ASSET_ID, HOA_ASSET_ID } from "@/lib/constants";

/** The asset choice in the UI (a discriminated pick, distinct from the wire Asset). */
export type AssetChoice = "xch" | "dig" | "hoa" | "cat";

/** The raw, editable builder form state (strings — the UI's own ephemeral state). */
export interface BuilderForm {
  recipient: string;
  assetChoice: AssetChoice;
  catId: string;
  scheme: "green" | "purple" | "orange" | "custom";
  color: string;
  presets: string;
  label: string;
  /** The widget style variant. */
  variant: WidgetVariant;
  /** Optional display symbol override for a CAT (auto-detected when blank). */
  symbol: string;
  /** Display name shown on the shareable tip-jar page (optional). */
  name: string;
  /** Optional custom logo URL, shown wherever the asset is named (see lib/logo.ts). */
  logo: string;
}

/** The derived, read-only outputs of the builder. */
export interface BuilderDerived {
  ok: boolean;
  snippet: string | null;
  errors: ValidationErrors;
  builderLink: string | null;
  rawLink: string | null;
  /** The deterministic, shareable tip-jar page URL (`<origin>/jar/<recipient>?…`). */
  jarLink: string | null;
}

const DEFAULT_FORM: BuilderForm = {
  recipient: "",
  assetChoice: "xch",
  catId: "",
  scheme: "green",
  color: "#7a3dff",
  presets: "",
  label: "",
  variant: "button",
  symbol: "",
  name: "",
  logo: "",
};

// The wire `asset` value for a given asset choice + custom CAT id.
function assetValue(choice: AssetChoice, catId: string): string {
  if (choice === "xch") return "xch";
  if (choice === "dig") return DIG_ASSET_ID;
  if (choice === "hoa") return HOA_ASSET_ID;
  return catId.trim();
}

// The wire `scheme`/`color` inputs from the form (custom → color; else the named scheme).
function schemeInputs(form: BuilderForm): { scheme: string; color: string } {
  if (form.scheme === "custom") return { scheme: "custom", color: form.color };
  return { scheme: form.scheme, color: "" };
}

// buildBuilderLink — the shareable pre-fill URL for the current (valid) config. `raw` appends the
// machine-readable flag.
function buildBuilderLink(form: BuilderForm, origin: string, raw: boolean): string {
  const p = new URLSearchParams();
  p.set("recipient", form.recipient.trim());
  p.set("asset", assetValue(form.assetChoice, form.catId));
  if (form.scheme === "custom") p.set("color", form.color);
  else p.set("scheme", form.scheme);
  if (form.presets.trim()) p.set("presets", form.presets.trim());
  if (form.label.trim()) p.set("label", form.label.trim());
  if (form.variant !== "button") p.set("variant", form.variant);
  if (form.symbol.trim()) p.set("symbol", form.symbol.trim());
  if (form.name.trim()) p.set("name", form.name.trim());
  if (form.logo.trim()) p.set("logo", form.logo.trim());
  if (raw) p.set("raw", "1");
  return `${origin}/?${p.toString()}`;
}

/** Seed a BuilderForm from URL query params (pre-fill on load). */
export function formFromQuery(search: string | URLSearchParams): BuilderForm {
  const q = parseQueryParams(search);
  if (!hasBuilderParams(q)) return { ...DEFAULT_FORM };

  const form: BuilderForm = { ...DEFAULT_FORM };
  if (q.recipient) form.recipient = q.recipient;
  if (q.label) form.label = q.label;
  if (q.presets) form.presets = q.presets;
  if (q.variant) form.variant = parseVariant(q.variant);
  if (q.symbol) form.symbol = q.symbol;
  if (q.name) form.name = q.name;
  if (q.logo) form.logo = q.logo;

  // Asset: xch | the DIG id | the HOA id | any other CAT id.
  const asset = (q.asset || "").trim().toLowerCase().replace(/^0x/, "");
  if (asset === "xch" || asset === "") {
    form.assetChoice = "xch";
  } else if (asset === DIG_ASSET_ID) {
    form.assetChoice = "dig";
  } else if (asset === HOA_ASSET_ID) {
    form.assetChoice = "hoa";
  } else {
    form.assetChoice = "cat";
    form.catId = asset;
  }

  // Scheme/color: an explicit color OR a hex scheme → custom; else the named scheme.
  const colorLike = q.color || (q.scheme && /^#?[0-9a-f]{6}$/i.test(q.scheme) ? q.scheme : null);
  if (colorLike) {
    form.scheme = "custom";
    form.color = colorLike.startsWith("#") ? colorLike : `#${colorLike}`;
  } else if (q.scheme === "purple") {
    form.scheme = "purple";
  } else if (q.scheme === "orange") {
    form.scheme = "orange";
  } else {
    form.scheme = "green";
  }
  return form;
}

export interface UseBuilderResult {
  form: BuilderForm;
  derived: BuilderDerived;
  setField: <K extends keyof BuilderForm>(key: K, value: BuilderForm[K]) => void;
  applyXchPreset: () => void;
  applyDigPreset: () => void;
  applyHoaPreset: () => void;
  reset: () => void;
}

/**
 * useBuilder — the builder hook. `initial` seeds the form (e.g. from query params); `origin` is the
 * base for generated links (defaults to the production origin, overridable in tests).
 */
export function useBuilder(initial?: BuilderForm, origin: string = SITE_ORIGIN): UseBuilderResult {
  const [form, setForm] = useState<BuilderForm>(initial ?? { ...DEFAULT_FORM });

  const setField = useCallback(<K extends keyof BuilderForm>(key: K, value: BuilderForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyXchPreset = useCallback(() => {
    setForm((prev) => ({ ...prev, assetChoice: "xch", catId: "", scheme: "green" }));
  }, []);

  const applyDigPreset = useCallback(() => {
    setForm((prev) => ({ ...prev, assetChoice: "dig", catId: "", scheme: "purple" }));
  }, []);

  const applyHoaPreset = useCallback(() => {
    setForm((prev) => ({ ...prev, assetChoice: "hoa", catId: "", scheme: "orange" }));
  }, []);

  const reset = useCallback(() => setForm({ ...DEFAULT_FORM }), []);

  const derived = useMemo<BuilderDerived>(() => {
    const { scheme, color } = schemeInputs(form);
    const result = buildSnippetFromInput(
      {
        recipient: form.recipient,
        asset: assetValue(form.assetChoice, form.catId),
        scheme,
        color,
        presets: form.presets,
        label: form.label,
        variant: form.variant,
        symbol: form.symbol,
        name: form.name,
        logo: form.logo,
      },
      origin,
    );
    if (!result.ok) {
      return {
        ok: false,
        snippet: null,
        errors: result.errors,
        builderLink: null,
        rawLink: null,
        jarLink: null,
      };
    }
    return {
      ok: true,
      snippet: result.snippet,
      errors: {},
      builderLink: buildBuilderLink(form, origin, false),
      rawLink: buildBuilderLink(form, origin, true),
      // The deterministic hosted tip-jar page for this config (canonical /jar/<recipient>?… URL).
      // The jar page controls its own presentation, so `variant` is not part of the jar URL. The
      // display name is the sanitized value from validateConfig (single source of truth).
      jarLink: jarUrl(
        {
          recipient: result.config.recipient,
          asset: result.config.asset,
          scheme: result.config.scheme,
          color: result.config.color,
          presets: result.config.presets,
          label: result.config.label,
          symbol: result.config.symbol,
          name: result.config.name,
          logo: result.config.logo,
        },
        origin,
      ),
    };
  }, [form, origin]);

  return { form, derived, setField, applyXchPreset, applyDigPreset, applyHoaPreset, reset };
}
