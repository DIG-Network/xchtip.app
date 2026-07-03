import type { Messages } from "./en";

export const es: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Botones de propina Chia integrables",

  heroKicker: "De billetera a billetera · on-chain · sin cuenta",
  heroTitleLead: "Un botón de propinas",
  heroTitleAccent: "para presumir.",
  intro:
    "Configúralo a la izquierda, míralo cobrar vida en el escenario y luego copia una línea de HTML " +
    "en cualquier sitio. Quienes dan propina conectan una billetera Chia y envían on-chain: de billetera a billetera, sin intermediarios.",

  recipientLabel: "Dirección Chia del destinatario",
  recipientHelp: "La billetera que recibe las propinas (empieza por xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Activo",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "Otro CAT",
  catIdLabel: "id de activo CAT",
  catIdHelp: "id de activo hexadecimal de 64 caracteres del CAT con el que dar propina.",
  catIdPlaceholder: "id de activo hex de 64…",
  schemeLabel: "Esquema de color",
  schemeGreen: "Verde (XCH)",
  schemePurple: "Morado ($DIG)",
  schemeOrange: "Naranja (HOA)",
  schemeCustom: "Color personalizado",
  colorLabel: "Color de acento",
  colorHelp: "Cualquier color hexadecimal de 6 dígitos (p. ej. #7a3dff).",
  presetsLabel: "Importes predefinidos (opcional)",
  presetsHelp: "Importes separados por comas, p. ej. 1,5,25. Déjalo en blanco para los valores por defecto.",
  labelLabel: "Texto del botón (opcional)",
  labelPlaceholder: "Propina",

  presetXchButton: "Predefinido: XCH (verde)",
  presetDigButton: "Predefinido: $DIG (morado)",
  presetHoaButton: "Predefinido: HOA (naranja)",

  stageCaption: "Vista previa en vivo: esto es exactamente lo que verán tus visitantes.",
  stageCaptionDisabled: "Introduce una dirección de destinatario para activar tu botón de propinas en vivo.",
  configureEyebrow: "Configurar",
  embedEyebrow: "Integrar",

  variantLabel: "Estilo del widget",
  variantHelp: "Cómo se ve el widget de propinas donde se integra.",
  variantButton: "Botón",
  variantCompact: "Compacto",
  variantCard: "Tarjeta de propina",

  symbolLabel: "Símbolo del token (opcional)",
  symbolHelp: "Se muestra en el botón y los importes. Se detecta automáticamente a partir del id del activo; puedes sobrescribirlo aquí.",
  symbolPlaceholder: "p. ej. DIG",
  symbolDetecting: "Detectando símbolo…",
  symbolDetected: "Detectado: ",

  visitButton: "Visitar",
  copyShort: "Copiar",

  feeNote: "Una comisión de red del 0,1 % va a xchtip.app; el resto va directo al destinatario.",

  previewHeading: "Vista previa en vivo",
  snippetHeading: "Fragmento para integrar",
  snippetHelp: "Pega esto una vez en el HTML de tu página, donde quieras el botón.",
  copyButton: "Copiar fragmento",
  copiedButton: "¡Copiado!",
  linkHeading: "Enlace del constructor para compartir",
  linkHelp: "Este enlace rellena el constructor de antemano. Añade &raw=1 para obtener el fragmento como texto plano.",
  rawLinkLabel: "URL del fragmento en bruto",

  jarLinkHeading: "Tu página de propinas",
  jarLinkHelp:
    "Una página lista para compartir con tu botón, sin necesidad de sitio ni integración. Todos los ajustes viven en " +
    "el enlace, así que funciona en cualquier lugar. Añade un nombre visible abajo para personalizarla.",
  jarLinkLabel: "URL de la página de propinas",
  jarNameLabel: "Nombre visible (opcional)",
  jarNameHelp: "Se muestra en tu página de propinas (p. ej. tu nombre o proyecto). Déjalo en blanco para una página genérica.",
  jarNamePlaceholder: "p. ej. Alice, o Café Zoë",
  shortLinkHeading: "Enlace corto",
  shortLinkHelp: "Convierte el enlace largo de la página de propinas en un enlace corto de xchtip.app fácil de compartir.",
  shortLinkButton: "Crear enlace corto",
  shortLinkCreating: "Creando…",
  shortLinkError: "Ahora mismo no se pudo crear un enlace corto. El enlace completo de tu página de propinas de arriba siempre funciona.",

  fixErrors: "Corrige los campos resaltados para generar un fragmento.",

  poweredBy: "Funciona con Chia. Conexión de billetera mediante WalletConnect.",
  digNetwork: "Una dapp de DIG Network",

  languageLabel: "Idioma",

  jarHeaderTag: "Una página de propinas Chia",
  jarEyebrow: "Enviar una propina",
  jarHeadingNamed: "Da propina a {name}",
  jarHeadingGeneric: "Enviar una propina",
  jarSub: "On-chain, de billetera a billetera, directo al destinatario. Pagado en",
  jarTo: "Para",
  jarCopyAddress: "Copiar la dirección completa",
  jarAmountsLabel: "Importes sugeridos",
  jarNote: "Conecta una billetera Chia para enviar. Nada se mueve hasta que lo apruebas en tu billetera.",
  jarBenefit1Title: "Las comisiones son céntimos",
  jarBenefit1Body: "Las transacciones de Chia cuestan una fracción de céntimo: casi toda tu propina llega.",
  jarBenefit2Title: "Directo a su billetera",
  jarBenefit2Body: "Sin cuenta, sin comisión de plataforma, sin intermediario reteniendo los fondos.",
  jarBenefit3Title: "Tú mantienes el control",
  jarBenefit3Body: "Firmas cada propina en tu propia billetera. Nada sale sin tu aprobación.",
  jarFooterCta: "Crea tu propia página de propinas →",
  jarMetaTitleNamed: "Da propina a {name} en {asset} · xchtip.app",
  jarMetaTitleGeneric: "Envía una propina en {asset} · xchtip.app",
  jarMetaWhoGeneric: "este destinatario",
  jarMetaDescription:
    "Envía a {who} una propina en {asset} en Chia: on-chain, de billetera a billetera, sin cuenta y sin comisión de plataforma. " +
    "Conecta una billetera Chia y la propina va directa a su billetera.",
  jarErrorTitle: "Este enlace de propina no es válido.",
  jarErrorBody:
    "La dirección o los ajustes de este enlace están incompletos o mal formados, así que no hay a quién dar propina. " +
    "Pide un enlace nuevo o crea el tuyo.",
  jarErrorCta: "Crear una página de propinas →",
};
