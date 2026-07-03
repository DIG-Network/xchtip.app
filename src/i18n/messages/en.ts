// The BASE (English) message catalog — the single source of truth for message IDS + default text.
// Every other locale is a Partial of this shape; any key a locale omits falls back to English here
// (per-key fallback), so the app is always fully rendered even mid-translation.
//
// Keys mirror the former strings.ts `S` keys 1:1 (stable ids), so a message is looked up by the same
// name components already use. Brand/scheme literals ($DIG, XCH, chia://, xchtip.app) are preserved
// verbatim in every locale.

export const en = {
  appName: "xchtip.app",
  headerTag: "Embeddable Chia tip buttons",

  // NOT "Free" — a 0.1% tip fee applies (feeNote), so a bare "Free" would misleadingly read as a
  // zero-fee tip. "Wallet-to-wallet" is the honest, distinct claim (no platform holds the funds).
  heroKicker: "Wallet-to-wallet · on-chain · no account",
  heroTitleLead: "A tip button",
  heroTitleAccent: "worth showing off.",
  intro:
    "Configure it on the left, watch it come to life on the stage, then copy one line of HTML " +
    "onto any site. Tippers connect a Chia wallet and send on-chain — wallet to wallet, no middleman.",

  recipientLabel: "Recipient Chia address",
  recipientHelp: "The wallet that receives tips (starts with xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Asset",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "Other CAT",
  catIdLabel: "CAT asset id",
  catIdHelp: "64-character hex asset id of the CAT to tip in.",
  catIdPlaceholder: "64-hex asset id…",
  schemeLabel: "Color scheme",
  schemeGreen: "Green (XCH)",
  schemePurple: "Purple ($DIG)",
  schemeOrange: "Orange (HOA)",
  schemeCustom: "Custom color",
  colorLabel: "Accent color",
  colorHelp: "Any 6-digit hex color (e.g. #7a3dff).",
  presetsLabel: "Amount presets (optional)",
  presetsHelp: "Comma-separated amounts, e.g. 1,5,25. Leave blank for defaults.",
  labelLabel: "Button label (optional)",
  labelPlaceholder: "Tip",

  // The one-click quick-preset row (asset + scheme in one tap) — a single "Presets" section
  // legend; each button is just named by coin (its glyph + scheme color already say the rest).
  quickPresetsLabel: "Presets",
  presetXchButton: "XCH",
  presetDigButton: "$DIG",
  presetHoaButton: "HOA",

  stageCaption: "Live preview — this is exactly what your visitors will see.",
  stageCaptionDisabled: "Enter a recipient address to activate your live tip button.",
  configureEyebrow: "Configure",
  embedEyebrow: "Share it",

  // Two audience paths (both offered up-front, equally prominent)
  pathPageTitle: "Share your tip page",
  pathPageAudience: "For anyone",
  pathPageDesc: "A ready-made page with your tip button — just share the link. No website needed.",
  pathEmbedTitle: "Embed on your site",
  pathEmbedAudience: "For developers",
  pathEmbedDesc: "Drop one line of HTML anywhere to show the tip button on your own site.",

  variantLabel: "Widget style",
  variantHelp: "How the tip widget looks where it's embedded.",
  variantButton: "Button",
  variantCompact: "Compact",
  variantPill: "Outline",
  variantInline: "Text link",
  variantBanner: "Banner",
  variantCard: "Tip card",

  symbolLabel: "Token symbol (optional)",
  symbolHelp: "Shown on the button + amounts. Auto-detected from the asset id; override here.",
  symbolPlaceholder: "e.g. DIG",
  symbolDetecting: "Detecting symbol…",
  symbolDetected: "Detected: ",

  visitButton: "Visit",
  copyShort: "Copy",

  feeNote: "A 0.1% network fee goes to xchtip.app; the rest goes straight to the recipient.",

  previewHeading: "Live preview",
  snippetHeading: "Embed snippet",
  snippetHelp: "Paste this once into your page's HTML, where you want the button.",
  copyButton: "Copy snippet",
  copiedButton: "Copied!",
  linkHeading: "Shareable builder link",
  linkHelp: "This link pre-fills the builder. Add &raw=1 to get the snippet as plain text.",
  rawLinkLabel: "Raw snippet URL",

  jarLinkHeading: "Your tip page",
  jarLinkHelp:
    "A ready-to-share page with your button — no site or embedding needed. All the settings live in " +
    "the link, so it works anywhere. Add a display name below to personalize it.",
  jarLinkLabel: "Tip page URL",
  jarNameLabel: "Display name (optional)",
  jarNameHelp: "Shown on your tip page (e.g. your name or project). Leave blank for a generic page.",
  jarNamePlaceholder: "e.g. Alice, or Café Zoë",
  logoLabel: "Logo URL (optional)",
  logoHelp: "A custom coin/brand mark shown next to the asset name, instead of the built-in mark. Must be an https:// image URL.",
  logoPlaceholder: "https://example.com/logo.png",
  shortLinkHeading: "Short link",
  shortLinkHelp: "Turn the long tip-page link into a short xchtip.app link that's easy to share.",
  shortLinkButton: "Create short link",
  shortLinkCreating: "Creating…",
  shortLinkError: "Couldn't create a short link right now. Your full tip-page link above always works.",

  fixErrors: "Fix the highlighted fields to generate a snippet.",

  poweredBy: "Runs on Chia. Wallet connection via WalletConnect.",
  digNetwork: "A DIG Network dapp",
  // A version tag isn't translatable prose (universally read as "version" across locales), so
  // only English defines it — every other locale gets it via the per-key English fallback.
  versionLabel: "v{version}",

  languageLabel: "Language",

  jarHeaderTag: "A Chia tip page",
  jarEyebrow: "Send a tip",
  jarHeadingNamed: "Tip {name}",
  jarHeadingGeneric: "Send a tip",
  jarSub: "On-chain, wallet to wallet — straight to the recipient. Paid in",
  jarTo: "To",
  jarCopyAddress: "Copy the full address",
  jarAmountsLabel: "Suggested amounts",
  jarNote: "Connect a Chia wallet to send. Nothing moves until you approve it in your wallet.",
  jarBenefit1Title: "Fees are pennies",
  jarBenefit1Body: "Chia transactions cost a fraction of a cent — nearly all of your tip lands.",
  jarBenefit2Title: "Straight to their wallet",
  jarBenefit2Body: "No account, no platform cut, no middleman holding the funds.",
  jarBenefit3Title: "You stay in control",
  jarBenefit3Body: "You sign every tip in your own wallet. Nothing leaves without your approval.",
  jarFooterCta: "Make your own tip page →",
  jarMetaTitleNamed: "Tip {name} in {asset} · xchtip.app",
  jarMetaTitleGeneric: "Send a {asset} tip · xchtip.app",
  jarMetaWhoGeneric: "this recipient",
  jarMetaDescription:
    "Send {who} a tip in {asset} on Chia — on-chain, wallet to wallet, no account and no platform cut. " +
    "Connect a Chia wallet and the tip goes straight to their wallet.",
  jarErrorTitle: "This tip link isn't valid.",
  jarErrorBody:
    "The address or settings in this link are incomplete or malformed, so there's nothing to tip to. " +
    "Ask for a fresh link, or make your own.",
  jarErrorCta: "Build a tip page →",
} as const;

/** The message id set — every locale is a Partial of this. */
export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
