// strings.ts — ALL user-facing copy, centralized in one module.
//
// i18n is NOT wired yet (xchtip.app is a single-purpose tool). Copy is centralized here with stable
// keys so a react-intl / message-catalog layer can bolt on later WITHOUT touching components —
// FOLLOW-UP: replace direct `S.*` reads with `intl.formatMessage({ id })` using these same keys, and
// add the ecosystem's standard locale set (CLAUDE.md §6.6). Until then components read `S.*` directly.

export const S = {
  appName: "xchtip.app",
  // Top bar one-liner (hidden on narrow screens).
  headerTag: "Embeddable Chia tip buttons",

  // Hero — the button you're building is the thesis; keep the copy short + confident.
  heroKicker: "Free · on-chain · no account",
  heroTitleLead: "A tip button",
  heroTitleAccent: "worth showing off.",
  // Legacy key kept for any external reference; the hero now uses the lead/accent pair above.
  tagline: "Build an embeddable Chia tip button — for XCH or any CAT.",
  intro:
    "Configure it on the left, watch it come to life on the stage, then copy one line of HTML " +
    "onto any site. Tippers connect a Chia wallet and send on-chain — wallet to wallet, no middleman.",

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

  // Stage + workbench section labels
  stageCaption: "Live preview — this is exactly what your visitors will see.",
  stageCaptionDisabled: "Enter a recipient address to activate your live tip button.",
  configureEyebrow: "Configure",
  embedEyebrow: "Embed",

  // Widget style variants
  variantLabel: "Widget style",
  variantHelp: "How the tip widget looks where it's embedded.",
  variantButton: "Button",
  variantCompact: "Compact",
  variantCard: "Tip card",

  // CAT symbol
  symbolLabel: "Token symbol (optional)",
  symbolHelp: "Shown on the button + amounts. Auto-detected from the asset id; override here.",
  symbolPlaceholder: "e.g. DIG",
  symbolDetecting: "Detecting symbol…",
  symbolDetected: "Detected: ",

  // Tip page URL actions
  visitButton: "Visit",
  copyShort: "Copy",

  // Output
  previewHeading: "Live preview",
  snippetHeading: "Embed snippet",
  snippetHelp: "Paste this once into your page's HTML, where you want the button.",
  copyButton: "Copy snippet",
  copiedButton: "Copied!",
  linkHeading: "Shareable builder link",
  linkHelp: "This link pre-fills the builder. Add &raw=1 to get the snippet as plain text.",
  rawLinkLabel: "Raw snippet URL",

  // Tip-jar share link (in the builder output)
  jarLinkHeading: "Your tip page",
  jarLinkHelp:
    "A ready-to-share page with your button — no site or embedding needed. All the settings live in " +
    "the link, so it works anywhere. Add a display name below to personalize it.",
  jarLinkLabel: "Tip page URL",
  jarNameLabel: "Display name (optional)",
  jarNameHelp: "Shown on your tip page (e.g. your name or project). Leave blank for a generic page.",
  jarNamePlaceholder: "e.g. Alice, or Café Zoë",
  shortLinkHeading: "Short link",
  shortLinkHelp: "Turn the long tip-page link into a short xchtip.app link that's easy to share.",
  shortLinkButton: "Create short link",
  shortLinkCreating: "Creating…",
  shortLinkError: "Couldn't create a short link right now. Your full tip-page link above always works.",

  // Errors
  fixErrors: "Fix the highlighted fields to generate a snippet.",

  // Footer
  poweredBy: "Runs on Chia. Wallet connection via WalletConnect.",
  digNetwork: "A DIG Network dapp",

  // ── Tip-jar landing page (a recipient's standalone, deterministic page) ──
  jarHeaderTag: "A Chia tip page",
  jarEyebrow: "Send a tip",
  jarHeadingNamed: "Tip {name}",
  jarHeadingGeneric: "Send a tip",
  jarSub: "On-chain, wallet to wallet — the recipient keeps 100%. Paid in",
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
  // Per-page SEO/social meta (each jar URL is its own shareable page). {name}/{asset}/{who} filled in.
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

export type StringKey = keyof typeof S;
