import type { Messages } from "./en";

export const ptBR: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Botões de gorjeta Chia incorporáveis",

  heroKicker: "Grátis · on-chain · sem conta",
  heroTitleLead: "Um botão de gorjeta",
  heroTitleAccent: "de dar orgulho.",
  intro:
    "Configure à esquerda, veja ganhar vida no palco e depois copie uma linha de HTML " +
    "em qualquer site. Quem dá gorjeta conecta uma carteira Chia e envia on-chain — de carteira para carteira, sem intermediários.",

  recipientLabel: "Endereço Chia do destinatário",
  recipientHelp: "A carteira que recebe as gorjetas (começa com xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Ativo",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "Outro CAT",
  catIdLabel: "id do ativo CAT",
  catIdHelp: "id do ativo hexadecimal de 64 caracteres do CAT usado na gorjeta.",
  catIdPlaceholder: "id de ativo hex de 64…",
  schemeLabel: "Esquema de cores",
  schemeGreen: "Verde (XCH)",
  schemePurple: "Roxo ($DIG)",
  schemeOrange: "Laranja (HOA)",
  schemeCustom: "Cor personalizada",
  colorLabel: "Cor de destaque",
  colorHelp: "Qualquer cor hexadecimal de 6 dígitos (ex.: #7a3dff).",
  presetsLabel: "Valores predefinidos (opcional)",
  presetsHelp: "Valores separados por vírgula, ex.: 1,5,25. Deixe em branco para os padrões.",
  labelLabel: "Texto do botão (opcional)",
  labelPlaceholder: "Gorjeta",

  presetXchButton: "Predefinido: XCH (verde)",
  presetDigButton: "Predefinido: $DIG (roxo)",
  presetHoaButton: "Predefinido: HOA (laranja)",

  stageCaption: "Prévia ao vivo — é exatamente o que seus visitantes vão ver.",
  stageCaptionDisabled: "Digite um endereço de destinatário para ativar seu botão de gorjeta ao vivo.",
  configureEyebrow: "Configurar",
  embedEyebrow: "Incorporar",

  variantLabel: "Estilo do widget",
  variantHelp: "Como o widget de gorjeta aparece onde é incorporado.",
  variantButton: "Botão",
  variantCompact: "Compacto",
  variantCard: "Cartão de gorjeta",

  symbolLabel: "Símbolo do token (opcional)",
  symbolHelp: "Exibido no botão e nos valores. Detectado automaticamente pelo id do ativo; sobrescreva aqui.",
  symbolPlaceholder: "ex.: DIG",
  symbolDetecting: "Detectando símbolo…",
  symbolDetected: "Detectado: ",

  visitButton: "Visitar",
  copyShort: "Copiar",

  feeNote: "Uma taxa de rede de 0,1% vai para o xchtip.app; o restante vai direto ao destinatário.",

  previewHeading: "Prévia ao vivo",
  snippetHeading: "Trecho para incorporar",
  snippetHelp: "Cole isto uma vez no HTML da sua página, onde quiser o botão.",
  copyButton: "Copiar trecho",
  copiedButton: "Copiado!",
  linkHeading: "Link do construtor para compartilhar",
  linkHelp: "Este link já preenche o construtor. Adicione &raw=1 para obter o trecho como texto simples.",
  rawLinkLabel: "URL do trecho bruto",

  jarLinkHeading: "Sua página de gorjetas",
  jarLinkHelp:
    "Uma página pronta para compartilhar com o seu botão — sem precisar de site ou incorporação. Todas as configurações ficam " +
    "no link, então funciona em qualquer lugar. Adicione um nome de exibição abaixo para personalizá-la.",
  jarLinkLabel: "URL da página de gorjetas",
  jarNameLabel: "Nome de exibição (opcional)",
  jarNameHelp: "Mostrado na sua página de gorjetas (ex.: seu nome ou projeto). Deixe em branco para uma página genérica.",
  jarNamePlaceholder: "ex.: Alice, ou Café Zoë",
  shortLinkHeading: "Link curto",
  shortLinkHelp: "Transforme o link longo da página de gorjetas em um link curto do xchtip.app, fácil de compartilhar.",
  shortLinkButton: "Criar link curto",
  shortLinkCreating: "Criando…",
  shortLinkError: "Não foi possível criar um link curto agora. O link completo da sua página de gorjetas acima sempre funciona.",

  fixErrors: "Corrija os campos destacados para gerar um trecho.",

  poweredBy: "Roda na Chia. Conexão de carteira via WalletConnect.",
  digNetwork: "Um dapp da DIG Network",

  languageLabel: "Idioma",

  jarHeaderTag: "Uma página de gorjetas Chia",
  jarEyebrow: "Enviar uma gorjeta",
  jarHeadingNamed: "Dar gorjeta a {name}",
  jarHeadingGeneric: "Enviar uma gorjeta",
  jarSub: "On-chain, de carteira para carteira — direto ao destinatário. Pago em",
  jarTo: "Para",
  jarCopyAddress: "Copiar o endereço completo",
  jarAmountsLabel: "Valores sugeridos",
  jarNote: "Conecte uma carteira Chia para enviar. Nada se move até você aprovar na sua carteira.",
  jarBenefit1Title: "As taxas são centavos",
  jarBenefit1Body: "As transações da Chia custam uma fração de centavo — quase toda a sua gorjeta chega.",
  jarBenefit2Title: "Direto para a carteira dela",
  jarBenefit2Body: "Sem conta, sem corte da plataforma, sem intermediário segurando os fundos.",
  jarBenefit3Title: "Você mantém o controle",
  jarBenefit3Body: "Você assina cada gorjeta na sua própria carteira. Nada sai sem a sua aprovação.",
  jarFooterCta: "Crie sua própria página de gorjetas →",
  jarMetaTitleNamed: "Dar gorjeta a {name} em {asset} · xchtip.app",
  jarMetaTitleGeneric: "Enviar uma gorjeta em {asset} · xchtip.app",
  jarMetaWhoGeneric: "este destinatário",
  jarMetaDescription:
    "Envie a {who} uma gorjeta em {asset} na Chia — on-chain, de carteira para carteira, sem conta e sem corte da plataforma. " +
    "Conecte uma carteira Chia e a gorjeta vai direto para a carteira dela.",
  jarErrorTitle: "Este link de gorjeta não é válido.",
  jarErrorBody:
    "O endereço ou as configurações neste link estão incompletos ou malformados, então não há para quem dar gorjeta. " +
    "Peça um link novo ou crie o seu.",
  jarErrorCta: "Criar uma página de gorjetas →",
};
