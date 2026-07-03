// constants.ts — canonical, ecosystem-verified constants for xchtip.app.
//
// The $DIG asset id is the on-chain canonical value used across the DIG ecosystem (verified
// against hub.dig.net embed/dig-tip.js + dig.net lib/constants.js). NEVER invent this — it is the
// tail hash of the $DIG CAT on Chia mainnet.

/** The production site origin (used for absolute URLs in snippets, SEO, sitemap). */
export const SITE_ORIGIN = "https://xchtip.app";

/** The embed asset path served from the site origin. */
export const EMBED_PATH = "/embed/xch-tip.js";

/** The canonical $DIG CAT asset id (Chia mainnet tail hash). 3 decimals: 1 DIG = 1000 base units. */
export const DIG_ASSET_ID = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";

/** The canonical HOA CAT asset id (Chia mainnet tail hash). A standard CAT: 3 decimals. */
export const HOA_ASSET_ID = "e816ee18ce2337c4128449bc539fbbe2ecfdd2098c4e7cab4667e223c3bdc23d";

/** DIG is a CAT with 3 decimals. */
export const DIG_DECIMALS = 3;

/** XCH has 12 decimals (1 XCH = 1e12 mojos). */
export const XCH_DECIMALS = 12;

/** The default XCH amount presets (whole XCH). */
export const DEFAULT_XCH_PRESETS = [0.1, 0.5, 1];

/** The default $DIG amount presets (whole DIG), matching the hub tip widget. */
export const DEFAULT_DIG_PRESETS = [1, 5, 25];

/** The default HOA amount presets (whole HOA). */
export const DEFAULT_HOA_PRESETS = [1, 5, 25];
