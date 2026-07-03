// useCatSymbol — auto-detect a CAT's ticker symbol from its asset id (debounced), exposing an
// explicit loading + detected state so the UI can show "Detecting…" and a detected suggestion. The
// user's manual override always wins (the caller passes it and skips the hint when set). Pure glue
// over the tested lib/catSymbol client; cancels stale lookups so fast edits don't race.

import { useEffect, useState } from "react";
import { lookupCatSymbol } from "@/lib/catSymbol";
import { isValidCatAssetId } from "@/lib/embed";

export interface CatSymbolState {
  /** True while a lookup is in flight. */
  detecting: boolean;
  /** The detected symbol, or null (unknown / not applicable / not yet resolved). */
  detected: string | null;
}

/**
 * useCatSymbol — resolve the symbol for `assetId` when `enabled` (the "Other CAT" asset is chosen).
 * Debounces edits and ignores stale results. Returns { detecting, detected }.
 */
export function useCatSymbol(assetId: string, enabled: boolean): CatSymbolState {
  const [state, setState] = useState<CatSymbolState>({ detecting: false, detected: null });

  useEffect(() => {
    const id = (assetId || "").trim();
    if (!enabled || !isValidCatAssetId(id)) {
      setState({ detecting: false, detected: null });
      return;
    }
    let cancelled = false;
    setState({ detecting: true, detected: null });
    const t = setTimeout(() => {
      lookupCatSymbol(id)
        .then((symbol) => {
          if (!cancelled) setState({ detecting: false, detected: symbol });
        })
        .catch(() => {
          if (!cancelled) setState({ detecting: false, detected: null });
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [assetId, enabled]);

  return state;
}
