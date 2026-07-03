import type { Messages } from "./en";

export const ja: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "埋め込み可能な Chia チップボタン",

  heroKicker: "ウォレット間送金 · オンチェーン · アカウント不要",
  heroTitleLead: "チップボタンを",
  heroTitleAccent: "自慢したくなる。",
  intro:
    "左側で設定し、ステージ上でリアルタイムに確認したら、HTML を 1 行" +
    "どんなサイトにでも貼り付けるだけ。送る人は Chia ウォレットを接続してオンチェーンで送金します——ウォレットからウォレットへ、仲介者なし。",

  recipientLabel: "受取先の Chia アドレス",
  recipientHelp: "チップを受け取るウォレットです（xch1… で始まります）。",
  recipientPlaceholder: "xch1…",
  assetLabel: "アセット",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "その他の CAT",
  catIdLabel: "CAT アセット id",
  catIdHelp: "チップに使う CAT の 64 文字の 16 進数アセット id です。",
  catIdPlaceholder: "64 桁の 16 進数アセット id…",
  schemeLabel: "配色",
  schemeGreen: "グリーン（XCH）",
  schemePurple: "パープル（$DIG）",
  schemeOrange: "オレンジ（HOA）",
  schemeCustom: "カスタムカラー",
  colorLabel: "アクセントカラー",
  colorHelp: "任意の 6 桁の 16 進数カラー（例: #7a3dff）。",
  presetsLabel: "金額プリセット（任意）",
  presetsHelp: "カンマ区切りの金額、例: 1,5,25。空欄でデフォルトになります。",
  labelLabel: "ボタンのラベル（任意）",
  labelPlaceholder: "チップ",

  presetXchButton: "プリセット: XCH（グリーン）",
  presetDigButton: "プリセット: $DIG（パープル）",
  presetHoaButton: "プリセット: HOA（オレンジ）",

  stageCaption: "リアルタイムプレビュー——訪問者に見えるのはまさにこれです。",
  stageCaptionDisabled: "受取先アドレスを入力すると、リアルタイムのチップボタンが有効になります。",
  configureEyebrow: "設定",
  embedEyebrow: "埋め込み",

  variantLabel: "ウィジェットのスタイル",
  variantHelp: "埋め込んだ場所でチップウィジェットがどう見えるか。",
  variantButton: "ボタン",
  variantCompact: "コンパクト",
  variantCard: "チップカード",

  symbolLabel: "トークンシンボル（任意）",
  symbolHelp: "ボタンと金額に表示されます。アセット id から自動検出されます。ここで上書きできます。",
  symbolPlaceholder: "例: DIG",
  symbolDetecting: "シンボルを検出中…",
  symbolDetected: "検出: ",

  visitButton: "開く",
  copyShort: "コピー",

  feeNote: "0.1% のネットワーク手数料は xchtip.app へ、残りはすべて受取先へ直接届きます。",

  previewHeading: "リアルタイムプレビュー",
  snippetHeading: "埋め込みスニペット",
  snippetHelp: "ボタンを置きたい場所に、このコードをページの HTML へ一度貼り付けてください。",
  copyButton: "スニペットをコピー",
  copiedButton: "コピーしました！",
  linkHeading: "共有可能なビルダーリンク",
  linkHelp: "このリンクはビルダーを事前入力します。&raw=1 を付けるとスニペットをプレーンテキストで取得できます。",
  rawLinkLabel: "生のスニペット URL",

  jarLinkHeading: "あなたのチップページ",
  jarLinkHelp:
    "ボタン付きの、すぐに共有できるページです——サイトも埋め込みも不要。すべての設定が" +
    "リンクに含まれているので、どこでも動きます。下に表示名を追加してカスタマイズしましょう。",
  jarLinkLabel: "チップページの URL",
  jarNameLabel: "表示名（任意）",
  jarNameHelp: "チップページに表示されます（例: 名前やプロジェクト）。空欄なら汎用ページになります。",
  jarNamePlaceholder: "例: Alice、または Café Zoë",
  shortLinkHeading: "短縮リンク",
  shortLinkHelp: "長いチップページのリンクを、共有しやすい xchtip.app の短縮リンクに変えます。",
  shortLinkButton: "短縮リンクを作成",
  shortLinkCreating: "作成中…",
  shortLinkError: "今は短縮リンクを作成できません。上の完全なチップページリンクはいつでも使えます。",

  fixErrors: "ハイライトされた項目を修正するとスニペットが生成されます。",

  poweredBy: "Chia 上で動作します。ウォレット接続は WalletConnect 経由です。",
  digNetwork: "DIG Network の dapp",

  languageLabel: "言語",

  jarHeaderTag: "Chia のチップページ",
  jarEyebrow: "チップを送る",
  jarHeadingNamed: "{name} にチップ",
  jarHeadingGeneric: "チップを送る",
  jarSub: "オンチェーン、ウォレットからウォレットへ——受取先へ直接。支払い通貨:",
  jarTo: "宛先",
  jarCopyAddress: "アドレス全体をコピー",
  jarAmountsLabel: "おすすめの金額",
  jarNote: "送るには Chia ウォレットを接続してください。ウォレットで承認するまで何も動きません。",
  jarBenefit1Title: "手数料はほんの数円",
  jarBenefit1Body: "Chia の取引コストは 1 セント未満——チップのほぼ全額が届きます。",
  jarBenefit2Title: "相手のウォレットへ直接",
  jarBenefit2Body: "アカウント不要、プラットフォーム手数料なし、資金を握る仲介者もいません。",
  jarBenefit3Title: "常にあなたが主導",
  jarBenefit3Body: "すべてのチップを自分のウォレットで署名します。承認なしに何も出ていきません。",
  jarFooterCta: "自分のチップページを作る →",
  jarMetaTitleNamed: "{asset} で {name} にチップ · xchtip.app",
  jarMetaTitleGeneric: "{asset} のチップを送る · xchtip.app",
  jarMetaWhoGeneric: "この受取先",
  jarMetaDescription:
    "Chia で {asset} を使って {who} にチップを送りましょう——オンチェーン、ウォレットからウォレットへ、アカウント不要でプラットフォーム手数料なし。" +
    "Chia ウォレットを接続すれば、チップは相手のウォレットへ直接届きます。",
  jarErrorTitle: "このチップリンクは無効です。",
  jarErrorBody:
    "このリンクのアドレスまたは設定が不完全か不正なため、チップの送り先がありません。" +
    "新しいリンクをもらうか、自分で作成してください。",
  jarErrorCta: "チップページを作る →",
};
