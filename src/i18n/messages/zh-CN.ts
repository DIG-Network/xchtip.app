import type { Messages } from "./en";

export const zhCN: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "可嵌入的 Chia 打赏按钮",

  heroKicker: "钱包对钱包 · 链上 · 无需账户",
  heroTitleLead: "一个打赏按钮",
  heroTitleAccent: "值得炫耀。",
  intro:
    "在左侧配置，在展示台上实时预览，然后把一行 HTML 复制到任意网站。" +
    "打赏者连接 Chia 钱包直接链上转账——钱包到钱包，没有中间商。",

  recipientLabel: "收款 Chia 地址",
  recipientHelp: "接收打赏的钱包（以 xch1… 开头）。",
  recipientPlaceholder: "xch1…",
  assetLabel: "资产",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "其他 CAT",
  catIdLabel: "CAT 资产 id",
  catIdHelp: "要打赏的 CAT 的 64 位十六进制资产 id。",
  catIdPlaceholder: "64 位十六进制资产 id…",
  schemeLabel: "配色方案",
  schemeGreen: "绿色（XCH）",
  schemePurple: "紫色（$DIG）",
  schemeOrange: "橙色（HOA）",
  schemeCustom: "自定义颜色",
  colorLabel: "强调色",
  colorHelp: "任意 6 位十六进制颜色（例如 #7a3dff）。",
  presetsLabel: "金额预设（可选）",
  presetsHelp: "以逗号分隔的金额，例如 1,5,25。留空则使用默认值。",
  labelLabel: "按钮文字（可选）",
  labelPlaceholder: "打赏",

  presetXchButton: "预设：XCH（绿色）",
  presetDigButton: "预设：$DIG（紫色）",
  presetHoaButton: "预设：HOA（橙色）",

  stageCaption: "实时预览——这正是访客将看到的样子。",
  stageCaptionDisabled: "输入收款地址以激活你的实时打赏按钮。",
  configureEyebrow: "配置",
  embedEyebrow: "嵌入",

  variantLabel: "组件样式",
  variantHelp: "打赏组件在嵌入处的外观。",
  variantButton: "按钮",
  variantCompact: "紧凑",
  variantCard: "打赏卡片",

  symbolLabel: "代币符号（可选）",
  symbolHelp: "显示在按钮和金额上。已从资产 id 自动检测；可在此覆盖。",
  symbolPlaceholder: "例如 DIG",
  symbolDetecting: "正在检测符号…",
  symbolDetected: "已检测到：",

  visitButton: "访问",
  copyShort: "复制",

  feeNote: "0.1% 的费用用于支持 xchtip.app，另加少量 XCH 网络费用——其余全部直达收款人。",

  previewHeading: "实时预览",
  snippetHeading: "嵌入代码",
  snippetHelp: "把这段代码粘贴到你页面 HTML 中想放置按钮的位置，一次即可。",
  copyButton: "复制代码",
  copiedButton: "已复制！",
  linkHeading: "可分享的构建器链接",
  linkHelp: "此链接会预填构建器。添加 &raw=1 可获取纯文本形式的代码。",
  rawLinkLabel: "原始代码 URL",

  jarLinkHeading: "你的打赏页面",
  jarLinkHelp:
    "一个可随时分享的页面，内含你的按钮——无需网站或嵌入。所有设置都保存在" +
    "链接中，因此在任何地方都能用。在下方添加显示名称以个性化它。",
  jarLinkLabel: "打赏页面 URL",
  jarNameLabel: "显示名称（可选）",
  jarNameHelp: "显示在你的打赏页面上（例如你的名字或项目）。留空则为通用页面。",
  jarNamePlaceholder: "例如 Alice，或 Café Zoë",
  shortLinkHeading: "短链接",
  shortLinkHelp: "把冗长的打赏页面链接变成便于分享的 xchtip.app 短链接。",
  shortLinkButton: "创建短链接",
  shortLinkCreating: "正在创建…",
  shortLinkError: "暂时无法创建短链接。上方完整的打赏页面链接始终可用。",

  fixErrors: "修正标出的字段以生成代码。",

  poweredBy: "运行于 Chia。通过 WalletConnect 连接钱包。",
  digNetwork: "一个 DIG Network dapp",

  languageLabel: "语言",

  jarHeaderTag: "一个 Chia 打赏页面",
  jarEyebrow: "送出打赏",
  jarHeadingNamed: "打赏 {name}",
  jarHeadingGeneric: "送出打赏",
  jarSub: "链上，钱包到钱包——直达收款人。使用",
  jarTo: "收款人",
  jarCopyAddress: "复制完整地址",
  jarAmountsLabel: "建议金额",
  jarNote: "连接 Chia 钱包即可送出。在你于钱包中批准前，任何资金都不会转移。",
  jarBenefit1Title: "手续费仅几分钱",
  jarBenefit1Body: "Chia 交易费用不到一分钱——你的打赏几乎全额到账。",
  jarBenefit2Title: "直达对方钱包",
  jarBenefit2Body: "无需账户，没有平台抽成，没有中间商托管资金。",
  jarBenefit3Title: "你始终掌控",
  jarBenefit3Body: "你在自己的钱包中为每一笔打赏签名。未经你批准，任何资金都不会转出。",
  jarFooterCta: "制作你自己的打赏页面 →",
  jarMetaTitleNamed: "用 {asset} 打赏 {name} · xchtip.app",
  jarMetaTitleGeneric: "送出一笔 {asset} 打赏 · xchtip.app",
  jarMetaWhoGeneric: "这位收款人",
  jarMetaDescription:
    "在 Chia 上用 {asset} 给 {who} 送出打赏——链上、钱包到钱包、无需账户、没有平台抽成。" +
    "连接 Chia 钱包，打赏直达对方钱包。",
  jarErrorTitle: "此打赏链接无效。",
  jarErrorBody:
    "此链接中的地址或设置不完整或格式错误，因此无法打赏。" +
    "请索取一个新链接，或制作你自己的。",
  jarErrorCta: "创建打赏页面 →",
};
