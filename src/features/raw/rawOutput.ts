// rawOutput — pure computation for the machine-readable raw mode: given the builder query params,
// produce the exact embed snippet text (on valid params) or a plain-text error line (on invalid
// params). No DOM. The RawSnippet component renders this into a <pre>; the edge /embed.txt function
// produces the same snippet server-side.

import type { QueryParams } from "@/lib/embed";
import { buildSnippetFromInput } from "@/lib/embed";
import { SITE_ORIGIN } from "@/lib/constants";

/** The raw output text for a set of query params (the snippet, or an `ERROR: …` line). */
export function rawOutput(params: QueryParams, origin: string = SITE_ORIGIN): { ok: boolean; text: string } {
  const result = buildSnippetFromInput(
    {
      recipient: params.recipient,
      asset: params.asset,
      scheme: params.scheme,
      color: params.color,
      presets: params.presets,
      label: params.label,
      variant: params.variant,
      symbol: params.symbol,
      name: params.name,
    },
    origin,
  );
  if (result.ok) return { ok: true, text: result.snippet };
  const fields = Object.entries(result.errors)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  return { ok: false, text: `ERROR: invalid parameters — ${fields || "missing recipient/asset"}` };
}
