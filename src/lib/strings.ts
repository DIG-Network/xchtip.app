// strings.ts — ALL user-facing copy, centralized in one module.
//
// i18n is NOT wired yet (xchtip.app is a single-purpose tool). Copy is centralized here with stable
// keys so a react-intl / message-catalog layer can bolt on later WITHOUT touching components —
// FOLLOW-UP: replace direct `S.*` reads with `intl.formatMessage({ id })` using these same keys, and
// add the ecosystem's standard locale set (CLAUDE.md §6.6). Until then components read `S.*` directly.

export const S = {
  appName: "xchtip.app",
  tagline: "Build an embeddable Chia tip button — for XCH or any CAT.",
  intro:
    "Pick who gets tipped, which asset, and a color. Copy the one-line snippet onto any site. " +
    "Tippers connect a Chia wallet and send on-chain, wallet to wallet — no account, no middleman.",

  // Builder form
  recipientLabel: "Recipient Chia address",
  recipientHelp: "The wallet that receives tips (starts with xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Asset",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetCustomCat: "Other CAT",
  catIdLabel: "CAT asset id",
  catIdHelp: "64-character hex asset id of the CAT to tip in.",
  catIdPlaceholder: "64-hex asset id…",
  schemeLabel: "Color scheme",
  schemeGreen: "Green (XCH)",
  schemePurple: "Purple ($DIG)",
  schemeCustom: "Custom color",
  colorLabel: "Accent color",
  colorHelp: "Any 6-digit hex color (e.g. #7a3dff).",
  presetsLabel: "Amount presets (optional)",
  presetsHelp: "Comma-separated amounts, e.g. 1,5,25. Leave blank for defaults.",
  labelLabel: "Button label (optional)",
  labelPlaceholder: "Tip",

  presetXchButton: "Preset: XCH (green)",
  presetDigButton: "Preset: $DIG (purple)",

  // Output
  previewHeading: "Live preview",
  snippetHeading: "Embed snippet",
  snippetHelp: "Paste this once into your page's HTML, where you want the button.",
  copyButton: "Copy snippet",
  copiedButton: "Copied!",
  linkHeading: "Shareable builder link",
  linkHelp: "This link pre-fills the builder. Add &raw=1 to get the snippet as plain text.",
  rawLinkLabel: "Raw snippet URL",

  // Errors
  fixErrors: "Fix the highlighted fields to generate a snippet.",

  // Footer
  poweredBy: "Runs on Chia. Wallet connection via WalletConnect.",
  digNetwork: "A DIG Network dapp",
} as const;

export type StringKey = keyof typeof S;
