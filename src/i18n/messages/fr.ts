import type { Messages } from "./en";

export const fr: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Boutons de pourboire Chia intégrables",

  heroKicker: "Gratuit · on-chain · sans compte",
  heroTitleLead: "Un bouton de pourboire",
  heroTitleAccent: "à montrer fièrement.",
  intro:
    "Configurez-le à gauche, regardez-le prendre vie sur la scène, puis copiez une ligne de HTML " +
    "sur n'importe quel site. Ceux qui donnent connectent un portefeuille Chia et envoient on-chain — de portefeuille à portefeuille, sans intermédiaire.",

  recipientLabel: "Adresse Chia du destinataire",
  recipientHelp: "Le portefeuille qui reçoit les pourboires (commence par xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Actif",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "Autre CAT",
  catIdLabel: "id d'actif CAT",
  catIdHelp: "id d'actif hexadécimal de 64 caractères du CAT avec lequel donner un pourboire.",
  catIdPlaceholder: "id d'actif hex de 64…",
  schemeLabel: "Palette de couleurs",
  schemeGreen: "Vert (XCH)",
  schemePurple: "Violet ($DIG)",
  schemeOrange: "Orange (HOA)",
  schemeCustom: "Couleur personnalisée",
  colorLabel: "Couleur d'accent",
  colorHelp: "N'importe quelle couleur hexadécimale à 6 chiffres (p. ex. #7a3dff).",
  presetsLabel: "Montants prédéfinis (facultatif)",
  presetsHelp: "Montants séparés par des virgules, p. ex. 1,5,25. Laissez vide pour les valeurs par défaut.",
  labelLabel: "Texte du bouton (facultatif)",
  labelPlaceholder: "Pourboire",

  presetXchButton: "Préréglage : XCH (vert)",
  presetDigButton: "Préréglage : $DIG (violet)",
  presetHoaButton: "Préréglage : HOA (orange)",

  stageCaption: "Aperçu en direct — c'est exactement ce que verront vos visiteurs.",
  stageCaptionDisabled: "Saisissez une adresse de destinataire pour activer votre bouton de pourboire en direct.",
  configureEyebrow: "Configurer",
  embedEyebrow: "Intégrer",

  variantLabel: "Style du widget",
  variantHelp: "L'apparence du widget de pourboire là où il est intégré.",
  variantButton: "Bouton",
  variantCompact: "Compact",
  variantCard: "Carte de pourboire",

  symbolLabel: "Symbole du jeton (facultatif)",
  symbolHelp: "Affiché sur le bouton et les montants. Détecté automatiquement depuis l'id de l'actif ; remplacez-le ici.",
  symbolPlaceholder: "p. ex. DIG",
  symbolDetecting: "Détection du symbole…",
  symbolDetected: "Détecté : ",

  visitButton: "Visiter",
  copyShort: "Copier",

  feeNote: "Des frais de réseau de 0,1 % vont à xchtip.app ; le reste va directement au destinataire.",

  previewHeading: "Aperçu en direct",
  snippetHeading: "Extrait à intégrer",
  snippetHelp: "Collez ceci une fois dans le HTML de votre page, à l'endroit voulu pour le bouton.",
  copyButton: "Copier l'extrait",
  copiedButton: "Copié !",
  linkHeading: "Lien du générateur à partager",
  linkHelp: "Ce lien préremplit le générateur. Ajoutez &raw=1 pour obtenir l'extrait en texte brut.",
  rawLinkLabel: "URL de l'extrait brut",

  jarLinkHeading: "Votre page de pourboires",
  jarLinkHelp:
    "Une page prête à partager avec votre bouton — sans site ni intégration. Tous les réglages tiennent dans " +
    "le lien, donc elle fonctionne partout. Ajoutez un nom d'affichage ci-dessous pour la personnaliser.",
  jarLinkLabel: "URL de la page de pourboires",
  jarNameLabel: "Nom d'affichage (facultatif)",
  jarNameHelp: "Affiché sur votre page de pourboires (p. ex. votre nom ou projet). Laissez vide pour une page générique.",
  jarNamePlaceholder: "p. ex. Alice, ou Café Zoë",
  shortLinkHeading: "Lien court",
  shortLinkHelp: "Transformez le long lien de la page de pourboires en un lien court xchtip.app facile à partager.",
  shortLinkButton: "Créer un lien court",
  shortLinkCreating: "Création…",
  shortLinkError: "Impossible de créer un lien court pour le moment. Le lien complet de votre page de pourboires ci-dessus fonctionne toujours.",

  fixErrors: "Corrigez les champs surlignés pour générer un extrait.",

  poweredBy: "Fonctionne sur Chia. Connexion du portefeuille via WalletConnect.",
  digNetwork: "Une dapp DIG Network",

  languageLabel: "Langue",

  jarHeaderTag: "Une page de pourboires Chia",
  jarEyebrow: "Envoyer un pourboire",
  jarHeadingNamed: "Donner un pourboire à {name}",
  jarHeadingGeneric: "Envoyer un pourboire",
  jarSub: "On-chain, de portefeuille à portefeuille — directement au destinataire. Payé en",
  jarTo: "À",
  jarCopyAddress: "Copier l'adresse complète",
  jarAmountsLabel: "Montants suggérés",
  jarNote: "Connectez un portefeuille Chia pour envoyer. Rien ne bouge tant que vous ne l'approuvez pas dans votre portefeuille.",
  jarBenefit1Title: "Des frais de quelques centimes",
  jarBenefit1Body: "Les transactions Chia coûtent une fraction de centime — la quasi-totalité de votre pourboire arrive.",
  jarBenefit2Title: "Directement dans son portefeuille",
  jarBenefit2Body: "Aucun compte, aucune commission de plateforme, aucun intermédiaire qui retient les fonds.",
  jarBenefit3Title: "Vous gardez le contrôle",
  jarBenefit3Body: "Vous signez chaque pourboire dans votre propre portefeuille. Rien ne part sans votre approbation.",
  jarFooterCta: "Créez votre propre page de pourboires →",
  jarMetaTitleNamed: "Donner un pourboire à {name} en {asset} · xchtip.app",
  jarMetaTitleGeneric: "Envoyer un pourboire en {asset} · xchtip.app",
  jarMetaWhoGeneric: "ce destinataire",
  jarMetaDescription:
    "Envoyez à {who} un pourboire en {asset} sur Chia — on-chain, de portefeuille à portefeuille, sans compte et sans commission de plateforme. " +
    "Connectez un portefeuille Chia et le pourboire va directement dans le sien.",
  jarErrorTitle: "Ce lien de pourboire n'est pas valide.",
  jarErrorBody:
    "L'adresse ou les réglages de ce lien sont incomplets ou mal formés, il n'y a donc personne à qui donner un pourboire. " +
    "Demandez un nouveau lien, ou créez le vôtre.",
  jarErrorCta: "Créer une page de pourboires →",
};
