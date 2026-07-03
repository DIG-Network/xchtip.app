import type { Messages } from "./en";

export const de: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Einbettbare Chia-Trinkgeld-Buttons",

  heroKicker: "Wallet-zu-Wallet · on-chain · ohne Konto",
  heroTitleLead: "Ein Trinkgeld-Button,",
  heroTitleAccent: "den man gern herzeigt.",
  intro:
    "Links konfigurieren, auf der Bühne live zusehen und dann eine Zeile HTML " +
    "auf jede Website kopieren. Wer Trinkgeld gibt, verbindet eine Chia-Wallet und sendet on-chain — von Wallet zu Wallet, ohne Mittelsmann.",

  recipientLabel: "Chia-Adresse des Empfängers",
  recipientHelp: "Die Wallet, die Trinkgeld erhält (beginnt mit xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Asset",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "Anderer CAT",
  catIdLabel: "CAT-Asset-id",
  catIdHelp: "64-stellige hexadezimale Asset-id des CAT, in dem das Trinkgeld gegeben wird.",
  catIdPlaceholder: "64-stellige Hex-Asset-id…",
  schemeLabel: "Farbschema",
  schemeGreen: "Grün (XCH)",
  schemePurple: "Violett ($DIG)",
  schemeOrange: "Orange (HOA)",
  schemeCustom: "Eigene Farbe",
  colorLabel: "Akzentfarbe",
  colorHelp: "Beliebige 6-stellige Hexfarbe (z. B. #7a3dff).",
  presetsLabel: "Betragsvorgaben (optional)",
  presetsHelp: "Kommagetrennte Beträge, z. B. 1,5,25. Leer lassen für Standardwerte.",
  labelLabel: "Button-Text (optional)",
  labelPlaceholder: "Trinkgeld",

  presetXchButton: "Vorgabe: XCH (grün)",
  presetDigButton: "Vorgabe: $DIG (violett)",
  presetHoaButton: "Vorgabe: HOA (orange)",

  stageCaption: "Live-Vorschau — genau das sehen deine Besucher.",
  stageCaptionDisabled: "Gib eine Empfängeradresse ein, um deinen Live-Trinkgeld-Button zu aktivieren.",
  configureEyebrow: "Konfigurieren",
  embedEyebrow: "Einbetten",

  variantLabel: "Widget-Stil",
  variantHelp: "Wie das Trinkgeld-Widget dort aussieht, wo es eingebettet ist.",
  variantButton: "Button",
  variantCompact: "Kompakt",
  variantCard: "Trinkgeld-Karte",

  symbolLabel: "Token-Symbol (optional)",
  symbolHelp: "Wird auf dem Button und bei Beträgen angezeigt. Automatisch aus der Asset-id erkannt; hier überschreibbar.",
  symbolPlaceholder: "z. B. DIG",
  symbolDetecting: "Symbol wird erkannt…",
  symbolDetected: "Erkannt: ",

  visitButton: "Öffnen",
  copyShort: "Kopieren",

  feeNote: "Eine Gebühr von 0,1 % unterstützt xchtip.app, zuzüglich einer kleinen XCH-Netzwerkgebühr – der Rest geht direkt an den Empfänger.",

  previewHeading: "Live-Vorschau",
  snippetHeading: "Einbettungs-Snippet",
  snippetHelp: "Füge dies einmal in das HTML deiner Seite ein, dort wo der Button erscheinen soll.",
  copyButton: "Snippet kopieren",
  copiedButton: "Kopiert!",
  linkHeading: "Teilbarer Builder-Link",
  linkHelp: "Dieser Link füllt den Builder vor. Füge &raw=1 hinzu, um das Snippet als reinen Text zu erhalten.",
  rawLinkLabel: "Roh-Snippet-URL",

  jarLinkHeading: "Deine Trinkgeld-Seite",
  jarLinkHelp:
    "Eine sofort teilbare Seite mit deinem Button — ohne Website oder Einbettung. Alle Einstellungen stecken " +
    "im Link, sie funktioniert also überall. Füge unten einen Anzeigenamen hinzu, um sie zu personalisieren.",
  jarLinkLabel: "URL der Trinkgeld-Seite",
  jarNameLabel: "Anzeigename (optional)",
  jarNameHelp: "Wird auf deiner Trinkgeld-Seite angezeigt (z. B. dein Name oder Projekt). Leer lassen für eine generische Seite.",
  jarNamePlaceholder: "z. B. Alice, oder Café Zoë",
  shortLinkHeading: "Kurzlink",
  shortLinkHelp: "Verwandle den langen Link deiner Trinkgeld-Seite in einen leicht teilbaren xchtip.app-Kurzlink.",
  shortLinkButton: "Kurzlink erstellen",
  shortLinkCreating: "Wird erstellt…",
  shortLinkError: "Ein Kurzlink lässt sich gerade nicht erstellen. Der vollständige Link deiner Trinkgeld-Seite oben funktioniert immer.",

  fixErrors: "Korrigiere die markierten Felder, um ein Snippet zu erzeugen.",

  poweredBy: "Läuft auf Chia. Wallet-Verbindung über WalletConnect.",
  digNetwork: "Eine DIG Network dapp",

  languageLabel: "Sprache",

  jarHeaderTag: "Eine Chia-Trinkgeld-Seite",
  jarEyebrow: "Trinkgeld senden",
  jarHeadingNamed: "{name} Trinkgeld geben",
  jarHeadingGeneric: "Trinkgeld senden",
  jarSub: "On-chain, von Wallet zu Wallet — direkt an den Empfänger. Bezahlt in",
  jarTo: "An",
  jarCopyAddress: "Vollständige Adresse kopieren",
  jarAmountsLabel: "Vorgeschlagene Beträge",
  jarNote: "Verbinde eine Chia-Wallet, um zu senden. Nichts bewegt sich, bis du es in deiner Wallet bestätigst.",
  jarBenefit1Title: "Gebühren im Cent-Bereich",
  jarBenefit1Body: "Chia-Transaktionen kosten den Bruchteil eines Cents — fast dein gesamtes Trinkgeld kommt an.",
  jarBenefit2Title: "Direkt in ihre Wallet",
  jarBenefit2Body: "Kein Konto, kein Plattformanteil, kein Mittelsmann, der die Gelder hält.",
  jarBenefit3Title: "Du behältst die Kontrolle",
  jarBenefit3Body: "Du signierst jedes Trinkgeld in deiner eigenen Wallet. Nichts geht ohne deine Zustimmung raus.",
  jarFooterCta: "Erstelle deine eigene Trinkgeld-Seite →",
  jarMetaTitleNamed: "{name} in {asset} Trinkgeld geben · xchtip.app",
  jarMetaTitleGeneric: "Trinkgeld in {asset} senden · xchtip.app",
  jarMetaWhoGeneric: "diesem Empfänger",
  jarMetaDescription:
    "Sende {who} ein Trinkgeld in {asset} auf Chia — on-chain, von Wallet zu Wallet, ohne Konto und ohne Plattformanteil. " +
    "Verbinde eine Chia-Wallet, und das Trinkgeld geht direkt in ihre Wallet.",
  jarErrorTitle: "Dieser Trinkgeld-Link ist ungültig.",
  jarErrorBody:
    "Die Adresse oder die Einstellungen in diesem Link sind unvollständig oder fehlerhaft, es gibt also niemanden, dem man Trinkgeld geben kann. " +
    "Bitte um einen neuen Link oder erstelle deinen eigenen.",
  jarErrorCta: "Trinkgeld-Seite erstellen →",
};
