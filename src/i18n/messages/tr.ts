import type { Messages } from "./en";

export const tr: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Yerleştirilebilir Chia bahşiş düğmeleri",

  heroKicker: "Ücretsiz · zincir üstü · hesapsız",
  heroTitleLead: "Gururla gösterebileceğin",
  heroTitleAccent: "bir bahşiş düğmesi.",
  intro:
    "Solda yapılandır, sahnede canlandığını izle, sonra tek satır HTML'i " +
    "istediğin siteye kopyala. Bahşiş verenler bir Chia cüzdanı bağlar ve zincir üstü gönderir — cüzdandan cüzdana, aracısız.",

  recipientLabel: "Alıcı Chia adresi",
  recipientHelp: "Bahşişleri alan cüzdan (xch1… ile başlar).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Varlık",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetCustomCat: "Diğer CAT",
  catIdLabel: "CAT varlık id'si",
  catIdHelp: "Bahşiş verilecek CAT'in 64 karakterlik onaltılık varlık id'si.",
  catIdPlaceholder: "64 haneli onaltılık varlık id'si…",
  schemeLabel: "Renk şeması",
  schemeGreen: "Yeşil (XCH)",
  schemePurple: "Mor ($DIG)",
  schemeCustom: "Özel renk",
  colorLabel: "Vurgu rengi",
  colorHelp: "Herhangi bir 6 haneli onaltılık renk (örn. #7a3dff).",
  presetsLabel: "Tutar ön ayarları (isteğe bağlı)",
  presetsHelp: "Virgülle ayrılmış tutarlar, örn. 1,5,25. Varsayılanlar için boş bırak.",
  labelLabel: "Düğme etiketi (isteğe bağlı)",
  labelPlaceholder: "Bahşiş",

  presetXchButton: "Ön ayar: XCH (yeşil)",
  presetDigButton: "Ön ayar: $DIG (mor)",

  stageCaption: "Canlı önizleme — ziyaretçilerinin göreceği tam olarak budur.",
  stageCaptionDisabled: "Canlı bahşiş düğmeni etkinleştirmek için bir alıcı adresi gir.",
  configureEyebrow: "Yapılandır",
  embedEyebrow: "Yerleştir",

  variantLabel: "Bileşen stili",
  variantHelp: "Bahşiş bileşeninin yerleştirildiği yerde nasıl göründüğü.",
  variantButton: "Düğme",
  variantCompact: "Kompakt",
  variantCard: "Bahşiş kartı",

  symbolLabel: "Jeton sembolü (isteğe bağlı)",
  symbolHelp: "Düğmede ve tutarlarda gösterilir. Varlık id'sinden otomatik algılanır; buradan değiştirebilirsin.",
  symbolPlaceholder: "örn. DIG",
  symbolDetecting: "Sembol algılanıyor…",
  symbolDetected: "Algılandı: ",

  visitButton: "Ziyaret et",
  copyShort: "Kopyala",

  feeNote: "%0,1'lik bir ağ ücreti xchtip.app'e gider; gerisi doğrudan alıcıya gider.",

  previewHeading: "Canlı önizleme",
  snippetHeading: "Yerleştirme parçacığı",
  snippetHelp: "Bunu, düğmeyi istediğin yere sayfanın HTML'ine bir kez yapıştır.",
  copyButton: "Parçacığı kopyala",
  copiedButton: "Kopyalandı!",
  linkHeading: "Paylaşılabilir oluşturucu bağlantısı",
  linkHelp: "Bu bağlantı oluşturucuyu önceden doldurur. Parçacığı düz metin olarak almak için &raw=1 ekle.",
  rawLinkLabel: "Ham parçacık URL'si",

  jarLinkHeading: "Bahşiş sayfan",
  jarLinkHelp:
    "Düğmenle paylaşmaya hazır bir sayfa — site veya yerleştirme gerekmez. Tüm ayarlar " +
    "bağlantıda yer alır, bu yüzden her yerde çalışır. Kişiselleştirmek için aşağıya bir görünen ad ekle.",
  jarLinkLabel: "Bahşiş sayfası URL'si",
  jarNameLabel: "Görünen ad (isteğe bağlı)",
  jarNameHelp: "Bahşiş sayfanda gösterilir (örn. adın veya projen). Genel bir sayfa için boş bırak.",
  jarNamePlaceholder: "örn. Alice ya da Café Zoë",
  shortLinkHeading: "Kısa bağlantı",
  shortLinkHelp: "Uzun bahşiş sayfası bağlantısını, paylaşması kolay bir xchtip.app kısa bağlantısına dönüştür.",
  shortLinkButton: "Kısa bağlantı oluştur",
  shortLinkCreating: "Oluşturuluyor…",
  shortLinkError: "Şu anda kısa bağlantı oluşturulamadı. Yukarıdaki tam bahşiş sayfası bağlantın her zaman çalışır.",

  fixErrors: "Parçacık oluşturmak için vurgulanan alanları düzelt.",

  poweredBy: "Chia üzerinde çalışır. Cüzdan bağlantısı WalletConnect ile sağlanır.",
  digNetwork: "Bir DIG Network dapp'i",

  languageLabel: "Dil",

  jarHeaderTag: "Bir Chia bahşiş sayfası",
  jarEyebrow: "Bahşiş gönder",
  jarHeadingNamed: "{name} kişisine bahşiş",
  jarHeadingGeneric: "Bahşiş gönder",
  jarSub: "Zincir üstü, cüzdandan cüzdana — doğrudan alıcıya. Ödeme birimi:",
  jarTo: "Alıcı",
  jarCopyAddress: "Tam adresi kopyala",
  jarAmountsLabel: "Önerilen tutarlar",
  jarNote: "Göndermek için bir Chia cüzdanı bağla. Cüzdanında onaylayana kadar hiçbir şey hareket etmez.",
  jarBenefit1Title: "Ücretler kuruşluk",
  jarBenefit1Body: "Chia işlemleri bir sentin küçük bir kesri kadardır — bahşişinin neredeyse tamamı ulaşır.",
  jarBenefit2Title: "Doğrudan cüzdanına",
  jarBenefit2Body: "Hesap yok, platform kesintisi yok, fonları tutan bir aracı yok.",
  jarBenefit3Title: "Kontrol sende kalır",
  jarBenefit3Body: "Her bahşişi kendi cüzdanında imzalarsın. Onayın olmadan hiçbir şey çıkmaz.",
  jarFooterCta: "Kendi bahşiş sayfanı oluştur →",
  jarMetaTitleNamed: "{name} kişisine {asset} ile bahşiş · xchtip.app",
  jarMetaTitleGeneric: "{asset} ile bahşiş gönder · xchtip.app",
  jarMetaWhoGeneric: "bu alıcıya",
  jarMetaDescription:
    "{who} kişisine Chia üzerinde {asset} ile bahşiş gönder — zincir üstü, cüzdandan cüzdana, hesapsız ve platform kesintisiz. " +
    "Bir Chia cüzdanı bağla, bahşiş doğrudan cüzdanına gitsin.",
  jarErrorTitle: "Bu bahşiş bağlantısı geçerli değil.",
  jarErrorBody:
    "Bu bağlantıdaki adres veya ayarlar eksik ya da hatalı, bu yüzden bahşiş verilecek kimse yok. " +
    "Yeni bir bağlantı iste veya kendininkini oluştur.",
  jarErrorCta: "Bahşiş sayfası oluştur →",
};
