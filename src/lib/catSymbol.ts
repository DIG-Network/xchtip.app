// catSymbol.ts — auto-detect a CAT's ticker symbol from its asset id.
//
// The builder lets a user tip in "Other CAT" by pasting a 64-hex asset id. Rather than make them also
// type the ticker, we look it up from the public token registries — Dexie first (the Chia DEX's asset
// index), then Spacescan as a fallback. The result is a suggestion the user can OVERRIDE. This is a
// best-effort convenience: any failure resolves to null (the caller falls back to a neutral "CAT"),
// and it NEVER throws. `fetchImpl` is injectable so the flow is unit-tested without a network.

import { DIG_ASSET_ID } from "./constants";
import { isValidCatAssetId } from "./embed";

const DEXIE_ASSET_API = "https://api.dexie.space/v1/assets";
const SPACESCAN_TOKEN_API = "https://api.spacescan.io/token/info";

// strip0x + lowercase.
function norm(id: string): string {
  return String(id ?? "").replace(/^0x/i, "").toLowerCase();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// Pull a non-empty string symbol/code from an unknown JSON shape, trying common field names.
function readSymbol(data: unknown): string | null {
  if (!isRecord(data)) return null;
  // Dexie: { assets: [{ code, name }] }. Spacescan: { symbol | ticker | code }.
  const asset = Array.isArray(data.assets) && isRecord(data.assets[0]) ? data.assets[0] : data;
  for (const key of ["code", "symbol", "ticker"]) {
    const v = (asset as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

async function fetchSymbol(url: string, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data: unknown = await res.json().catch(() => null);
    return readSymbol(data);
  } catch {
    return null;
  }
}

/**
 * lookupCatSymbol — resolve a display symbol for a CAT asset id, or null if unknown.
 *   • the canonical $DIG tail → "$DIG" (no network),
 *   • else Dexie, then Spacescan,
 *   • invalid id / all sources fail → null (never throws).
 */
export async function lookupCatSymbol(
  assetId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const id = norm(assetId);
  if (!isValidCatAssetId(id)) return null;
  if (id === DIG_ASSET_ID) return "$DIG";

  const fromDexie = await fetchSymbol(`${DEXIE_ASSET_API}?id=${id}&page_size=1`, fetchImpl);
  if (fromDexie) return fromDexie;

  const fromSpacescan = await fetchSymbol(`${SPACESCAN_TOKEN_API}/${id}`, fetchImpl);
  if (fromSpacescan) return fromSpacescan;

  return null;
}
