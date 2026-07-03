import type { Messages } from "./en";

export const zhTW: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "可嵌入的 Chia 打賞按鈕",

  heroKicker: "錢包對錢包 · 鏈上 · 無需帳戶",
  heroTitleLead: "一個打賞按鈕",
  heroTitleAccent: "值得炫耀。",
  intro:
    "在左側設定，在展示台上即時預覽，然後把一行 HTML 複製到任何網站。" +
    "打賞者連接 Chia 錢包直接鏈上轉帳——錢包到錢包，沒有中間商。",

  recipientLabel: "收款 Chia 地址",
  recipientHelp: "接收打賞的錢包（以 xch1… 開頭）。",
  recipientPlaceholder: "xch1…",
  assetLabel: "資產",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "其他 CAT",
  catIdLabel: "CAT 資產 id",
  catIdHelp: "要打賞的 CAT 的 64 位十六進位資產 id。",
  catIdPlaceholder: "64 位十六進位資產 id…",
  schemeLabel: "配色方案",
  schemeGreen: "綠色（XCH）",
  schemePurple: "紫色（$DIG）",
  schemeOrange: "橙色（HOA）",
  schemeCustom: "自訂顏色",
  colorLabel: "強調色",
  colorHelp: "任何 6 位十六進位顏色（例如 #7a3dff）。",
  presetsLabel: "金額預設（選填）",
  presetsHelp: "以逗號分隔的金額，例如 1,5,25。留空則使用預設值。",
  labelLabel: "按鈕文字（選填）",
  labelPlaceholder: "打賞",

  presetXchButton: "預設：XCH（綠色）",
  presetDigButton: "預設：$DIG（紫色）",
  presetHoaButton: "預設：HOA（橙色）",

  stageCaption: "即時預覽——這正是訪客將看到的樣子。",
  stageCaptionDisabled: "輸入收款地址以啟用你的即時打賞按鈕。",
  configureEyebrow: "設定",
  embedEyebrow: "嵌入",

  variantLabel: "元件樣式",
  variantHelp: "打賞元件在嵌入處的外觀。",
  variantButton: "按鈕",
  variantCompact: "精簡",
  variantCard: "打賞卡片",

  symbolLabel: "代幣符號（選填）",
  symbolHelp: "顯示在按鈕與金額上。已從資產 id 自動偵測；可在此覆寫。",
  symbolPlaceholder: "例如 DIG",
  symbolDetecting: "正在偵測符號…",
  symbolDetected: "已偵測到：",

  visitButton: "前往",
  copyShort: "複製",

  feeNote: "0.1% 的費用用於支持 xchtip.app，另加少量 XCH 網路費用——其餘全部直達收款人。",

  previewHeading: "即時預覽",
  snippetHeading: "嵌入程式碼",
  snippetHelp: "把這段程式碼貼到你頁面 HTML 中想放置按鈕的位置，一次即可。",
  copyButton: "複製程式碼",
  copiedButton: "已複製！",
  linkHeading: "可分享的建構器連結",
  linkHelp: "此連結會預先填入建構器。加上 &raw=1 可取得純文字形式的程式碼。",
  rawLinkLabel: "原始程式碼 URL",

  jarLinkHeading: "你的打賞頁面",
  jarLinkHelp:
    "一個可隨時分享的頁面，內含你的按鈕——無需網站或嵌入。所有設定都保存在" +
    "連結中，因此在任何地方都能用。在下方加入顯示名稱以個人化它。",
  jarLinkLabel: "打賞頁面 URL",
  jarNameLabel: "顯示名稱（選填）",
  jarNameHelp: "顯示在你的打賞頁面上（例如你的名字或專案）。留空則為通用頁面。",
  jarNamePlaceholder: "例如 Alice，或 Café Zoë",
  shortLinkHeading: "短連結",
  shortLinkHelp: "把冗長的打賞頁面連結變成便於分享的 xchtip.app 短連結。",
  shortLinkButton: "建立短連結",
  shortLinkCreating: "正在建立…",
  shortLinkError: "暫時無法建立短連結。上方完整的打賞頁面連結始終可用。",

  fixErrors: "修正標示的欄位以產生程式碼。",

  poweredBy: "執行於 Chia。透過 WalletConnect 連接錢包。",
  digNetwork: "一個 DIG Network dapp",

  languageLabel: "語言",

  jarHeaderTag: "一個 Chia 打賞頁面",
  jarEyebrow: "送出打賞",
  jarHeadingNamed: "打賞 {name}",
  jarHeadingGeneric: "送出打賞",
  jarSub: "鏈上，錢包到錢包——直達收款人。使用",
  jarTo: "收款人",
  jarCopyAddress: "複製完整地址",
  jarAmountsLabel: "建議金額",
  jarNote: "連接 Chia 錢包即可送出。在你於錢包中核准前，任何資金都不會轉移。",
  jarBenefit1Title: "手續費僅幾分錢",
  jarBenefit1Body: "Chia 交易費用不到一分錢——你的打賞幾乎全額到帳。",
  jarBenefit2Title: "直達對方錢包",
  jarBenefit2Body: "無需帳戶，沒有平台抽成，沒有中間商托管資金。",
  jarBenefit3Title: "你始終掌控",
  jarBenefit3Body: "你在自己的錢包中為每一筆打賞簽名。未經你核准，任何資金都不會轉出。",
  jarFooterCta: "製作你自己的打賞頁面 →",
  jarMetaTitleNamed: "用 {asset} 打賞 {name} · xchtip.app",
  jarMetaTitleGeneric: "送出一筆 {asset} 打賞 · xchtip.app",
  jarMetaWhoGeneric: "這位收款人",
  jarMetaDescription:
    "在 Chia 上用 {asset} 給 {who} 送出打賞——鏈上、錢包到錢包、無需帳戶、沒有平台抽成。" +
    "連接 Chia 錢包，打賞直達對方錢包。",
  jarErrorTitle: "此打賞連結無效。",
  jarErrorBody:
    "此連結中的地址或設定不完整或格式錯誤，因此無法打賞。" +
    "請索取一個新連結，或製作你自己的。",
  jarErrorCta: "建立打賞頁面 →",
};
