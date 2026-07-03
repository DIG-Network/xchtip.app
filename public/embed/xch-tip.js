/*!
 * xch-tip.js — the xchtip.app embeddable Chia TIP widget.
 * Stable URL: https://xchtip.app/embed/xch-tip.js
 *
 * Drop ONE <script> on ANY page to render a "Tip" button that lets a visitor tip a recipient
 * directly, wallet→wallet, in XCH or ANY CAT (including $DIG). It is FULLY SELF-CONTAINED: it does
 * NOT depend on any app bundle, the page's framework, or any global. On click it opens its OWN
 * WalletConnect modal (its own WalletConnect session — QR + copy-link, works best with a Chia wallet
 * such as Sage), then a tipping modal (pick/enter an amount → sign → send). The recipient is baked
 * into the embed (data-recipient); the spend is built client-side, signed by the visitor's wallet,
 * and broadcast to Chia mainnet.
 *
 *   <script
 *     src="https://xchtip.app/embed/xch-tip.js"
 *     data-recipient="xch1…"                (REQUIRED: the recipient bech32m Chia address)
 *     data-asset="xch"                       (REQUIRED: "xch" OR a 64-hex CAT asset id)
 *     data-scheme="green"                    (optional: green | purple; default green)
 *     data-color="#7a3dff"                   (optional: a custom 6-hex accent — overrides scheme)
 *     data-label="Tip"                       (optional button label)
 *     data-amount-presets="1,5,25"           (optional preset amounts, whole units of the asset)
 *     data-align="center"                    (optional: center|left|right; default center)
 *     data-size="md"                         (optional: md|lg; lg = a prominent tip-page button)
 *     data-variant="button"                  (optional: button|compact|pill|inline|banner|card)
 *     data-symbol="DIG"                      (optional: display symbol for a CAT; overrides auto)
 *     data-name="Alice"                      (optional: recipient display name; shown on card/banner)
 *     data-locale="ja"                       (optional: UI language; default = the visitor's browser)
 *     data-wc-project-id="<your projectId>"  (optional — defaults to xchtip.app's)
 *     data-target="#my-container"            (optional CSS selector to mount into; default: inline)
 *     async></script>
 *
 * FEE: a 0.1% protocol fee on each tip is routed to the xchtip.app fee address (same asset), created
 * as a coin alongside the recipient output in the same signed spend; the recipient gets the rest. The
 * tipper is shown a subtle disclosure. Tips too small to carry a whole-base-unit fee pay no fee.
 *
 * PROVENANCE: this widget is a GENERALIZED port of the proven hub.dig.net tip widget
 * (public/embed/dig-tip.js). That widget solved self-hosted wasm loading (esm.sh's wrapper drops
 * __wbg_set_wasm, so the wasm-bindgen glue + _bg.wasm are SELF-HOSTED and instantiated by hand),
 * WalletConnect→Sage connect with session reuse, all config baked into the embed via data-attributes
 * (no runtime ping home), centered-in-parent layout, and the DIG-CAT ring spend. Here the payment leg
 * is generalized: XCH = a plain standard spend; a CAT = a CAT ring spend to the recipient for that
 * asset id (the $DIG path from the hub widget, generalized to any asset id).
 *
 * The wallet connect prompt shows the xchtip.app brand. An approved wallet session is reused across
 * page loads on the SAME site (WalletConnect persists it to this origin's localStorage). Cross-DOMAIN
 * reuse is not possible: browsers partition third-party storage per top-level site.
 */
(function () {
  "use strict";

  var GLOBAL = (window.__xchTip = window.__xchTip || { booted: false, wc: null, chia: null, styled: false });

  // Pinned CDN module specifiers (loaded at click time so the widget is inert until used).
  var WC_CDN = "https://esm.sh/@walletconnect/sign-client@2.19.0";
  var QR_CDN = "https://esm.sh/qrcode@1.5.4";

  // chia-wallet-sdk-wasm is a wasm-bindgen BUNDLER-target build with no runtime init; esm.sh's wrapper
  // does not reliably re-export __wbg_set_wasm. We SELF-HOST the glue + wasm on the SAME ORIGIN this
  // widget was served from and do the bundler step by hand in loadChia() (fetch wasm → instantiate
  // against the glue's imports → __wbg_set_wasm). Files copied verbatim from
  // node_modules/chia-wallet-sdk-wasm/ into public/embed/vendor/ (Vite copies public/ into dist/).
  var CHIA_VENDOR = "/embed/vendor";
  var CHIA_GLUE_FILE = "chia_wallet_sdk_wasm_bg.js";
  var CHIA_WASM_FILE = "chia_wallet_sdk_wasm_bg.wasm";

  var CHAIN = "chia:mainnet";
  var COINSET = "https://api.coinset.org";
  var XCH_MOJOS_PER_XCH = 1000000000000; // 1 XCH = 1e12 mojos
  var CAT_BASE_UNITS = 1000; // CATs in the ecosystem use 3 decimals (1 unit = 1000 base units)

  // Protocol fee: 0.1% of every tip is routed to the xchtip.app fee address (same asset as the tip).
  // The recipient receives the remainder. The fee is floor(baseUnits/1000); if a tip is too small to
  // carry a >=1-base-unit fee, NO fee coin is created (the recipient gets the whole tip).
  var FEE_ADDRESS = "xch1kxdp5hsu34e2ku8p4e6f3ap27dw8fvhjghxe88dcve8n77zwekhsemh66h";
  var FEE_BPS = 1; // 1 per 1000 = 0.1%
  var FEE_DENOM = 1000;
  // splitFee(total) -> { fee, net } in base units (BigInt). fee = floor(total/1000); net = total-fee.
  function splitFee(totalBaseUnits) {
    var total = BigInt(totalBaseUnits);
    var fee = (total * BigInt(FEE_BPS)) / BigInt(FEE_DENOM);
    if (fee < 0n) fee = 0n;
    if (fee >= total) fee = 0n; // never leave the recipient with nothing
    return { fee: fee, net: total - fee };
  }

  // ── Widget i18n ──────────────────────────────────────────────────────────────────────────────────
  // The widget honors the tipper's locale (data-locale on the embed, else navigator.language). A tiny
  // inline catalog covers the widget's user-facing strings across the ecosystem's 14 locales; any key
  // a locale omits falls back to English. Brand/scheme literals ($DIG, XCH, xchtip.app) stay verbatim;
  // {amt}/{unit} placeholders are substituted by wt(). Mirrors the site's message ids where they overlap.
  var WIDGET_LOCALES = ["en", "zh-CN", "zh-TW", "ko", "ja", "ru", "es", "pt-BR", "fr", "de", "tr", "vi", "id", "hi"];
  var WIDGET_I18N = {
    en: {
      title: "Send a tip", connectSub: "Scan with your Chia wallet to connect, then approve the tip. Works best with Sage.",
      copyLink: "Copy connection link", copied: "Copied!", noWallet: "No wallet yet?", getSage: "Get Sage ↗",
      opening: "Opening your wallet connection…", pickSub: "Send {unit} straight to the recipient’s wallet — on-chain, no middleman.",
      custom: "Custom", cancel: "Cancel", send: "Send {amt}", preparing: "Preparing your {amt} tip…",
      approveSub: "Approve the {amt} tip in your wallet. This sends directly to the recipient — wallet to wallet.",
      back: "Back", signSend: "Sign & send", waiting: "Waiting for your wallet to sign…",
      doneSub: "Tip sent! You sent {amt} — broadcast to the Chia network.", done: "Done",
      close: "Close", tryAgain: "Try again", fee: "Includes a 0.1% network fee to xchtip.app.",
      lowDig: "Low on $DIG? Get it on", disconnect: "Disconnect wallet", enterAmount: "Enter amount",
      balance: "Your balance: {bal}",
    },
    "zh-CN": { title: "发送打赏", connectSub: "用你的 Chia 钱包扫码连接，然后批准打赏。推荐使用 Sage。", copyLink: "复制连接链接", copied: "已复制！", noWallet: "还没有钱包？", getSage: "获取 Sage ↗", opening: "正在打开钱包连接…", pickSub: "把 {unit} 直接发送到收款人的钱包 —— 链上，无中间人。", custom: "自定义", cancel: "取消", send: "发送 {amt}", preparing: "正在准备你的 {amt} 打赏…", approveSub: "在你的钱包中批准 {amt} 打赏。将直接发送给收款人 —— 钱包到钱包。", back: "返回", signSend: "签名并发送", waiting: "等待你的钱包签名…", doneSub: "打赏已发送！你发送了 {amt} —— 已广播到 Chia 网络。", done: "完成", close: "关闭", tryAgain: "重试", fee: "包含 0.1% 的网络手续费给 xchtip.app。", lowDig: "$DIG 不足？可在这里获取", disconnect: "断开钱包", enterAmount: "输入金额", balance: "你的余额：{bal}" },
    "zh-TW": { title: "發送打賞", connectSub: "用你的 Chia 錢包掃碼連接，然後批准打賞。推薦使用 Sage。", copyLink: "複製連接連結", copied: "已複製！", noWallet: "還沒有錢包？", getSage: "取得 Sage ↗", opening: "正在開啟錢包連接…", pickSub: "把 {unit} 直接發送到收款人的錢包 —— 鏈上，無中間人。", custom: "自訂", cancel: "取消", send: "發送 {amt}", preparing: "正在準備你的 {amt} 打賞…", approveSub: "在你的錢包中批准 {amt} 打賞。將直接發送給收款人 —— 錢包到錢包。", back: "返回", signSend: "簽名並發送", waiting: "等待你的錢包簽名…", doneSub: "打賞已發送！你發送了 {amt} —— 已廣播到 Chia 網路。", done: "完成", close: "關閉", tryAgain: "重試", fee: "包含 0.1% 的網路手續費給 xchtip.app。", lowDig: "$DIG 不足？可在這裡取得", disconnect: "中斷錢包", enterAmount: "輸入金額", balance: "你的餘額：{bal}" },
    ko: { title: "팁 보내기", connectSub: "Chia 지갑으로 스캔하여 연결한 뒤 팁을 승인하세요. Sage 사용을 권장합니다.", copyLink: "연결 링크 복사", copied: "복사됨!", noWallet: "지갑이 없으신가요?", getSage: "Sage 받기 ↗", opening: "지갑 연결을 여는 중…", pickSub: "{unit}를 받는 사람 지갑으로 바로 전송 — 온체인, 중개자 없음.", custom: "직접 입력", cancel: "취소", send: "{amt} 보내기", preparing: "{amt} 팁을 준비하는 중…", approveSub: "지갑에서 {amt} 팁을 승인하세요. 받는 사람에게 지갑에서 지갑으로 바로 전송됩니다.", back: "뒤로", signSend: "서명 후 전송", waiting: "지갑 서명을 기다리는 중…", doneSub: "팁 전송 완료! {amt}를 보냈습니다 — Chia 네트워크에 브로드캐스트됨.", done: "완료", close: "닫기", tryAgain: "다시 시도", fee: "0.1% 네트워크 수수료가 xchtip.app로 갑니다.", lowDig: "$DIG가 부족한가요? 여기서 구하세요", disconnect: "지갑 연결 해제", enterAmount: "금액 입력", balance: "내 잔액: {bal}" },
    ja: { title: "チップを送る", connectSub: "Chia ウォレットでスキャンして接続し、チップを承認してください。Sage を推奨します。", copyLink: "接続リンクをコピー", copied: "コピーしました！", noWallet: "ウォレットがない？", getSage: "Sage を入手 ↗", opening: "ウォレット接続を開いています…", pickSub: "{unit} を受取先のウォレットへ直接送金 — オンチェーン、仲介者なし。", custom: "カスタム", cancel: "キャンセル", send: "{amt} を送る", preparing: "{amt} のチップを準備中…", approveSub: "ウォレットで {amt} のチップを承認してください。受取先へ直接、ウォレットからウォレットへ送金されます。", back: "戻る", signSend: "署名して送信", waiting: "ウォレットの署名を待っています…", doneSub: "チップを送りました！{amt} を送金し、Chia ネットワークにブロードキャストされました。", done: "完了", close: "閉じる", tryAgain: "再試行", fee: "0.1% のネットワーク手数料が xchtip.app に入ります。", lowDig: "$DIG が不足？こちらで入手", disconnect: "ウォレットを切断", enterAmount: "金額を入力", balance: "残高: {bal}" },
    ru: { title: "Отправить чаевые", connectSub: "Отсканируйте кошельком Chia для подключения, затем подтвердите чаевые. Лучше всего с Sage.", copyLink: "Копировать ссылку", copied: "Скопировано!", noWallet: "Нет кошелька?", getSage: "Установить Sage ↗", opening: "Открываем подключение кошелька…", pickSub: "Отправьте {unit} прямо в кошелёк получателя — ончейн, без посредников.", custom: "Другая", cancel: "Отмена", send: "Отправить {amt}", preparing: "Готовим ваши чаевые {amt}…", approveSub: "Подтвердите чаевые {amt} в кошельке. Средства уйдут напрямую получателю — кошелёк в кошелёк.", back: "Назад", signSend: "Подписать и отправить", waiting: "Ожидаем подпись кошелька…", doneSub: "Чаевые отправлены! Вы отправили {amt} — транслировано в сеть Chia.", done: "Готово", close: "Закрыть", tryAgain: "Повторить", fee: "Включает комиссию сети 0,1% в пользу xchtip.app.", lowDig: "Мало $DIG? Получите на", disconnect: "Отключить кошелёк", enterAmount: "Введите сумму", balance: "Ваш баланс: {bal}" },
    es: { title: "Enviar propina", connectSub: "Escanea con tu billetera Chia para conectar y luego aprueba la propina. Funciona mejor con Sage.", copyLink: "Copiar enlace de conexión", copied: "¡Copiado!", noWallet: "¿Aún no tienes billetera?", getSage: "Obtener Sage ↗", opening: "Abriendo la conexión de tu billetera…", pickSub: "Envía {unit} directamente a la billetera del destinatario — on-chain, sin intermediarios.", custom: "Personalizado", cancel: "Cancelar", send: "Enviar {amt}", preparing: "Preparando tu propina de {amt}…", approveSub: "Aprueba la propina de {amt} en tu billetera. Se envía directamente al destinatario — de billetera a billetera.", back: "Atrás", signSend: "Firmar y enviar", waiting: "Esperando la firma de tu billetera…", doneSub: "¡Propina enviada! Enviaste {amt} — transmitido a la red Chia.", done: "Listo", close: "Cerrar", tryAgain: "Reintentar", fee: "Incluye una comisión de red del 0,1% para xchtip.app.", lowDig: "¿Poco $DIG? Consíguelo en", disconnect: "Desconectar billetera", enterAmount: "Ingresa un monto", balance: "Tu saldo: {bal}" },
    "pt-BR": { title: "Enviar gorjeta", connectSub: "Escaneie com sua carteira Chia para conectar e aprove a gorjeta. Funciona melhor com a Sage.", copyLink: "Copiar link de conexão", copied: "Copiado!", noWallet: "Ainda não tem carteira?", getSage: "Obter Sage ↗", opening: "Abrindo a conexão da carteira…", pickSub: "Envie {unit} direto para a carteira do destinatário — on-chain, sem intermediários.", custom: "Personalizado", cancel: "Cancelar", send: "Enviar {amt}", preparing: "Preparando sua gorjeta de {amt}…", approveSub: "Aprove a gorjeta de {amt} na sua carteira. Vai direto para o destinatário — de carteira para carteira.", back: "Voltar", signSend: "Assinar e enviar", waiting: "Aguardando a assinatura da carteira…", doneSub: "Gorjeta enviada! Você enviou {amt} — transmitido para a rede Chia.", done: "Concluído", close: "Fechar", tryAgain: "Tentar de novo", fee: "Inclui uma taxa de rede de 0,1% para o xchtip.app.", lowDig: "Pouco $DIG? Consiga em", disconnect: "Desconectar carteira", enterAmount: "Digite um valor", balance: "Seu saldo: {bal}" },
    fr: { title: "Envoyer un pourboire", connectSub: "Scannez avec votre portefeuille Chia pour vous connecter, puis approuvez le pourboire. Idéal avec Sage.", copyLink: "Copier le lien de connexion", copied: "Copié !", noWallet: "Pas encore de portefeuille ?", getSage: "Obtenir Sage ↗", opening: "Ouverture de la connexion du portefeuille…", pickSub: "Envoyez des {unit} directement au portefeuille du destinataire — on-chain, sans intermédiaire.", custom: "Personnalisé", cancel: "Annuler", send: "Envoyer {amt}", preparing: "Préparation de votre pourboire de {amt}…", approveSub: "Approuvez le pourboire de {amt} dans votre portefeuille. Envoi direct au destinataire — de portefeuille à portefeuille.", back: "Retour", signSend: "Signer et envoyer", waiting: "En attente de la signature du portefeuille…", doneSub: "Pourboire envoyé ! Vous avez envoyé {amt} — diffusé sur le réseau Chia.", done: "Terminé", close: "Fermer", tryAgain: "Réessayer", fee: "Inclut des frais de réseau de 0,1 % pour xchtip.app.", lowDig: "Pas assez de $DIG ? Procurez-vous-en sur", disconnect: "Déconnecter le portefeuille", enterAmount: "Saisir un montant", balance: "Votre solde : {bal}" },
    de: { title: "Trinkgeld senden", connectSub: "Mit deiner Chia-Wallet scannen, um zu verbinden, dann das Trinkgeld bestätigen. Am besten mit Sage.", copyLink: "Verbindungslink kopieren", copied: "Kopiert!", noWallet: "Noch keine Wallet?", getSage: "Sage holen ↗", opening: "Wallet-Verbindung wird geöffnet…", pickSub: "Sende {unit} direkt an die Wallet des Empfängers — on-chain, ohne Mittelsmann.", custom: "Eigener", cancel: "Abbrechen", send: "{amt} senden", preparing: "Dein {amt}-Trinkgeld wird vorbereitet…", approveSub: "Bestätige das {amt}-Trinkgeld in deiner Wallet. Es geht direkt an den Empfänger — Wallet zu Wallet.", back: "Zurück", signSend: "Signieren & senden", waiting: "Warte auf die Signatur deiner Wallet…", doneSub: "Trinkgeld gesendet! Du hast {amt} gesendet — ins Chia-Netzwerk übertragen.", done: "Fertig", close: "Schließen", tryAgain: "Erneut versuchen", fee: "Enthält eine Netzwerkgebühr von 0,1 % für xchtip.app.", lowDig: "Wenig $DIG? Hol es dir bei", disconnect: "Wallet trennen", enterAmount: "Betrag eingeben", balance: "Dein Guthaben: {bal}" },
    tr: { title: "Bahşiş gönder", connectSub: "Bağlanmak için Chia cüzdanınla tara, ardından bahşişi onayla. En iyi Sage ile çalışır.", copyLink: "Bağlantı linkini kopyala", copied: "Kopyalandı!", noWallet: "Henüz cüzdanın yok mu?", getSage: "Sage’i edin ↗", opening: "Cüzdan bağlantısı açılıyor…", pickSub: "{unit} doğrudan alıcının cüzdanına gönder — zincir üstü, aracı yok.", custom: "Özel", cancel: "İptal", send: "{amt} gönder", preparing: "{amt} bahşişin hazırlanıyor…", approveSub: "Cüzdanında {amt} bahşişi onayla. Doğrudan alıcıya gider — cüzdandan cüzdana.", back: "Geri", signSend: "İmzala ve gönder", waiting: "Cüzdanının imzası bekleniyor…", doneSub: "Bahşiş gönderildi! {amt} gönderdin — Chia ağına yayınlandı.", done: "Tamam", close: "Kapat", tryAgain: "Tekrar dene", fee: "xchtip.app’e %0,1 ağ ücreti dahildir.", lowDig: "$DIG az mı? Şuradan edin", disconnect: "Cüzdanı bağlantısını kes", enterAmount: "Tutar gir", balance: "Bakiyen: {bal}" },
    vi: { title: "Gửi tiền boa", connectSub: "Quét bằng ví Chia của bạn để kết nối, rồi phê duyệt tiền boa. Hoạt động tốt nhất với Sage.", copyLink: "Sao chép liên kết kết nối", copied: "Đã sao chép!", noWallet: "Chưa có ví?", getSage: "Tải Sage ↗", opening: "Đang mở kết nối ví…", pickSub: "Gửi {unit} thẳng vào ví người nhận — on-chain, không trung gian.", custom: "Tùy chỉnh", cancel: "Hủy", send: "Gửi {amt}", preparing: "Đang chuẩn bị tiền boa {amt}…", approveSub: "Phê duyệt tiền boa {amt} trong ví. Gửi thẳng đến người nhận — ví tới ví.", back: "Quay lại", signSend: "Ký & gửi", waiting: "Đang chờ ví ký…", doneSub: "Đã gửi tiền boa! Bạn đã gửi {amt} — phát lên mạng Chia.", done: "Xong", close: "Đóng", tryAgain: "Thử lại", fee: "Bao gồm phí mạng 0,1% cho xchtip.app.", lowDig: "Thiếu $DIG? Nhận tại", disconnect: "Ngắt kết nối ví", enterAmount: "Nhập số tiền", balance: "Số dư của bạn: {bal}" },
    id: { title: "Kirim tip", connectSub: "Pindai dengan dompet Chia untuk terhubung, lalu setujui tip. Paling baik dengan Sage.", copyLink: "Salin tautan koneksi", copied: "Tersalin!", noWallet: "Belum punya dompet?", getSage: "Dapatkan Sage ↗", opening: "Membuka koneksi dompet…", pickSub: "Kirim {unit} langsung ke dompet penerima — on-chain, tanpa perantara.", custom: "Khusus", cancel: "Batal", send: "Kirim {amt}", preparing: "Menyiapkan tip {amt} Anda…", approveSub: "Setujui tip {amt} di dompet Anda. Langsung ke penerima — dompet ke dompet.", back: "Kembali", signSend: "Tanda tangani & kirim", waiting: "Menunggu tanda tangan dompet…", doneSub: "Tip terkirim! Anda mengirim {amt} — disiarkan ke jaringan Chia.", done: "Selesai", close: "Tutup", tryAgain: "Coba lagi", fee: "Termasuk biaya jaringan 0,1% untuk xchtip.app.", lowDig: "Kekurangan $DIG? Dapatkan di", disconnect: "Putuskan dompet", enterAmount: "Masukkan jumlah", balance: "Saldo Anda: {bal}" },
    hi: { title: "टिप भेजें", connectSub: "कनेक्ट करने के लिए अपने Chia वॉलेट से स्कैन करें, फिर टिप को स्वीकृत करें। Sage के साथ सबसे अच्छा काम करता है।", copyLink: "कनेक्शन लिंक कॉपी करें", copied: "कॉपी हो गया!", noWallet: "अभी तक वॉलेट नहीं है?", getSage: "Sage पाएं ↗", opening: "आपका वॉलेट कनेक्शन खोला जा रहा है…", pickSub: "{unit} सीधे प्राप्तकर्ता के वॉलेट में भेजें — ऑन-चेन, कोई बिचौलिया नहीं।", custom: "कस्टम", cancel: "रद्द करें", send: "{amt} भेजें", preparing: "आपकी {amt} टिप तैयार की जा रही है…", approveSub: "अपने वॉलेट में {amt} टिप स्वीकृत करें। यह सीधे प्राप्तकर्ता को जाती है — वॉलेट से वॉलेट।", back: "वापस", signSend: "साइन करें और भेजें", waiting: "आपके वॉलेट के हस्ताक्षर की प्रतीक्षा…", doneSub: "टिप भेज दी गई! आपने {amt} भेजा — Chia नेटवर्क पर प्रसारित।", done: "पूर्ण", close: "बंद करें", tryAgain: "फिर से प्रयास करें", fee: "इसमें xchtip.app के लिए 0.1% नेटवर्क शुल्क शामिल है।", lowDig: "$DIG कम है? इससे प्राप्त करें", disconnect: "वॉलेट डिस्कनेक्ट करें", enterAmount: "राशि दर्ज करें", balance: "आपका बैलेंस: {bal}" },
  };
  // Resolve the widget locale: an explicit data-locale, else the browser language, mapped to one of
  // our 14 (exact → language prefix → en). Traditional-Chinese regions map to zh-TW.
  function resolveWidgetLocale(raw) {
    var cands = [];
    if (raw) cands.push(String(raw));
    if (typeof navigator !== "undefined") {
      if (navigator.languages) cands = cands.concat(navigator.languages);
      else if (navigator.language) cands.push(navigator.language);
    }
    for (var i = 0; i < cands.length; i++) {
      var tag = String(cands[i]).trim();
      if (!tag) continue;
      for (var j = 0; j < WIDGET_LOCALES.length; j++) if (WIDGET_LOCALES[j].toLowerCase() === tag.toLowerCase()) return WIDGET_LOCALES[j];
      var lang = tag.split(/[-_]/)[0].toLowerCase();
      var region = (tag.split(/[-_]/)[1] || "").toUpperCase();
      if (lang === "zh") return (region === "TW" || region === "HK" || region === "MO" || /hant/i.test(tag)) ? "zh-TW" : "zh-CN";
      if (lang === "pt") return "pt-BR";
      for (var k = 0; k < WIDGET_LOCALES.length; k++) if (WIDGET_LOCALES[k] === lang) return lang;
    }
    return "en";
  }
  // wt(locale, key, vars) — translated string with English fallback + {placeholder} substitution.
  function wt(locale, key, vars) {
    var cat = WIDGET_I18N[locale] || WIDGET_I18N.en;
    var s = (cat && cat[key] != null) ? cat[key] : WIDGET_I18N.en[key];
    if (s == null) return "";
    if (vars) for (var k in vars) if (Object.prototype.hasOwnProperty.call(vars, k)) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }

  // The WC method set the widget needs (a subset of the CHIP-0002/chia set).
  var WC_METHODS = ["chia_getAddress", "chip0002_getAssetCoins", "chip0002_signCoinSpends"];

  var SAGE_WALLET_URL = "https://sagewallet.net/";

  // Get-$DIG funnel — the canonical venues to acquire $DIG, so a tipper low on DIG can refill from one
  // click without leaving the flow. Mirrors the hub tip widget (lib/links.js GET_DIG_SOURCES). Shown
  // only when tipping in $DIG.
  var GET_DIG_SOURCES = [
    { name: "TibetSwap", url: "https://v2.tibetswap.io/" },
    { name: "dexie", url: "https://dexie.space/offers/" + DIG_ASSET_ID + "/XCH" },
    { name: "9mm.pro", url: "https://xch.9mm.pro/token/" + DIG_ASSET_ID },
  ];
  function getDigHtml(accentColor, locale) {
    var links = GET_DIG_SOURCES.map(function (s) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" style="color:' + accentColor + '">' + escapeHtml(s.name) + " ↗</a>";
    }).join(" · ");
    return '<p class="xt-getdig">' + escapeHtml(wt(locale, "lowDig")) + " " + links + "</p>";
  }

  // Default WalletConnect (Reown) projectId — xchtip.app's own, so a drop-in embed works with NO
  // data-wc-project-id. The placeholder is substituted in the DEPLOYED asset by
  // scripts/inject-embed-config.mjs at build time; NEVER the real id in committed source.
  var DEFAULT_WC_PROJECT_ID = "__XCHTIP_WC_PROJECT_ID__";
  function defaultProjectId() {
    return DEFAULT_WC_PROJECT_ID && DEFAULT_WC_PROJECT_ID.indexOf("__") !== 0 ? DEFAULT_WC_PROJECT_ID : "";
  }

  // ── Named schemes (byte-compatible with src/lib/schemes.ts). ────────────────────────────────────
  var SCHEMES = {
    green: { from: "#3ab54a", to: "#1f8f3a", text: "#ffffff", shadow: "rgba(31,143,58,.34)" },
    purple: { from: "#7a3dff", to: "#ff00de", text: "#ffffff", shadow: "rgba(122,61,255,.34)" },
  };
  function normHex(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    var m = /^#?([0-9a-f]{6})$/.exec(s);
    return m ? "#" + m[1] : null;
  }
  function darken(hex, amt) {
    var n = normHex(hex);
    if (!n) return hex;
    var r = Math.round(parseInt(n.slice(1, 3), 16) * (1 - amt));
    var g = Math.round(parseInt(n.slice(3, 5), 16) * (1 - amt));
    var b = Math.round(parseInt(n.slice(5, 7), 16) * (1 - amt));
    var h = function (x) { return x.toString(16).padStart(2, "0"); };
    return "#" + h(r) + h(g) + h(b);
  }
  function rgbaFromHex(hex, a) {
    var n = normHex(hex);
    if (!n) return "rgba(0,0,0," + a + ")";
    return "rgba(" + parseInt(n.slice(1, 3), 16) + "," + parseInt(n.slice(3, 5), 16) + "," + parseInt(n.slice(5, 7), 16) + "," + a + ")";
  }
  function resolveScheme(schemeName, color) {
    var hex = normHex(color);
    if (hex) return { from: hex, to: darken(hex, 0.22), text: "#ffffff", shadow: rgbaFromHex(hex, 0.34) };
    if (schemeName === "purple") return SCHEMES.purple;
    return SCHEMES.green;
  }

  // ── Pure config/amount logic (mirrors src/lib/embed.ts). ────────────────────────────────────────
  function strip0x(h) { return String(h == null ? "" : h).replace(/^0x/i, "").toLowerCase(); }
  function isValidCatId(s) { return /^[0-9a-f]{64}$/i.test(strip0x(s)); }
  function parseAsset(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    if (s === "" || s === "xch") return s === "xch" ? { kind: "xch" } : null;
    var id = strip0x(s);
    return isValidCatId(id) ? { kind: "cat", assetId: id } : null;
  }
  function parseAmount(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (s === "") return null;
    var n = Number(s);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }
  function parsePresets(raw, isXch) {
    if (raw == null) return null;
    var out = [];
    String(raw).split(",").forEach(function (part) {
      var n = Number(part.trim());
      if (isFinite(n) && n > 0) out.push(n);
    });
    return out.length ? out : null;
  }
  function defaultPresets(asset) { return asset.kind === "xch" ? [0.1, 0.5, 1] : [1, 5, 25]; }
  // The canonical $DIG CAT tail (mirrors src/lib/constants.ts) — used to pick the DIG symbol + mark.
  var DIG_ASSET_ID = "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81";
  function isDigAsset(asset) { return asset.kind === "cat" && asset.assetId === DIG_ASSET_ID; }
  // The display symbol for an asset. A CAT uses the explicit override (data-symbol) if given, else
  // "$DIG" for the canonical DIG tail, else a neutral "CAT" (the builder can auto-detect + pass one in).
  function assetUnitLabel(asset, symbolOverride) {
    if (asset.kind === "xch") return "XCH";
    var s = String(symbolOverride == null ? "" : symbolOverride).trim();
    if (s) return s;
    if (isDigAsset(asset)) return "$DIG";
    return "CAT";
  }

  // ── Brand glyphs (inline, self-contained SVG; currentColor so they inherit the button text). ──────
  // XCH → a Chia leaf mark; $DIG → the DIG "D" mark; anything else → the heart. Tiny single-path SVGs
  // so the embed stays dependency-free and the glyph scales with the button.
  var GLYPH_HEART = '<span class="xt-heart" aria-hidden="true">♥</span>';
  function glyphChiaLeaf() {
    return '<svg class="xt-glyph" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="M12 2C7 6 4 10 4 14.5A7.5 7.5 0 0 0 11.5 22c.3 0 .5-.2.5-.5V12c0-.3.2-.5.5-.5s.5.2.5.5v9.5c0 .3.2.5.5.5A7.5 7.5 0 0 0 20 14.5C20 10 17 6 12 2z"/></svg>';
  }
  function glyphDig() {
    return '<svg class="xt-glyph" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="M5 4h6a8 8 0 0 1 0 16H5V4zm3.2 3.1v9.8H11a4.9 4.9 0 0 0 0-9.8H8.2z"/></svg>';
  }
  // Choose the leading glyph for a config: Chia leaf for XCH, DIG mark for the DIG CAT, else heart.
  // A custom color scheme always uses the heart (it's a personal accent, not a brand asset).
  function glyphFor(asset, scheme) {
    if (scheme === "custom") return GLYPH_HEART;
    if (asset.kind === "xch") return glyphChiaLeaf();
    if (isDigAsset(asset)) return glyphDig();
    return GLYPH_HEART;
  }
  function amountToBaseUnits(asset, amount) {
    if (asset.kind === "xch") return Math.round(Number(amount) * XCH_MOJOS_PER_XCH);
    return Math.round(Number(amount) * CAT_BASE_UNITS);
  }
  function defaultLabel(asset, symbolOverride) {
    if (asset.kind === "xch") return "Tip in XCH";
    if (isDigAsset(asset)) return "Tip in DIG";
    var s = String(symbolOverride == null ? "" : symbolOverride).trim();
    if (s) return "Tip in " + s;
    return "Send a tip";
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseAlign(raw) {
    var v = String(raw == null ? "" : raw).trim().toLowerCase();
    return v === "left" || v === "right" ? v : "center";
  }
  // Button size: "lg" for a dedicated tip PAGE (bigger button); default "md" everywhere else.
  function parseSize(raw) {
    return String(raw == null ? "" : raw).trim().toLowerCase() === "lg" ? "lg" : "md";
  }
  // Widget style variant. Any unknown value → "button".
  //   button  — the default gradient pill button
  //   compact — a smaller inline pill
  //   pill    — a ghost/outline button (transparent, accent border) for text-heavy sites
  //   inline  — a minimal inline text link ("♥ Tip in XCH")
  //   banner  — a full-width bar (pitch text + button), for a page header/footer
  //   card    — a self-contained tip card (recipient + pitch + button)
  var WIDGET_VARIANTS = ["button", "compact", "pill", "inline", "banner", "card"];
  function parseVariant(raw) {
    var v = String(raw == null ? "" : raw).trim().toLowerCase();
    return WIDGET_VARIANTS.indexOf(v) >= 0 ? v : "button";
  }

  // decode a bech32m Chia address to its 32-byte puzzle hash hex (mirrors src/lib/bech32m.ts). Returns
  // the puzzle-hash hex or null. The widget spends TO this puzzle hash.
  var BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  function bech32Polymod(values) {
    var GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    var chk = 1;
    for (var i = 0; i < values.length; i++) {
      var top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ values[i];
      for (var j = 0; j < 5; j++) if ((top >> j) & 1) chk ^= GEN[j];
    }
    return chk;
  }
  function bech32HrpExpand(hrp) {
    var out = [];
    for (var i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
    out.push(0);
    for (var k = 0; k < hrp.length; k++) out.push(hrp.charCodeAt(k) & 31);
    return out;
  }
  function bech32ConvertBits(data, from, to, pad) {
    var acc = 0, bits = 0, out = [], maxv = (1 << to) - 1;
    for (var i = 0; i < data.length; i++) {
      var value = data[i];
      if (value < 0 || value >> from !== 0) return null;
      acc = (acc << from) | value;
      bits += from;
      while (bits >= to) { bits -= to; out.push((acc >> bits) & maxv); }
    }
    if (pad) { if (bits > 0) out.push((acc << (to - bits)) & maxv); }
    else if (bits >= from || ((acc << (to - bits)) & maxv) !== 0) return null;
    return out;
  }
  function addressToPuzzleHash(addr) {
    var s = String(addr == null ? "" : addr);
    if (s !== s.toLowerCase() && s !== s.toUpperCase()) return null;
    var lower = s.toLowerCase();
    var sep = lower.lastIndexOf("1");
    if (sep < 1 || sep + 7 > lower.length) return null;
    var hrp = lower.slice(0, sep);
    if (hrp !== "xch" && hrp !== "txch") return null;
    var data = [];
    for (var i = sep + 1; i < lower.length; i++) {
      var idx = BECH32_CHARSET.indexOf(lower[i]);
      if (idx === -1) return null;
      data.push(idx);
    }
    if (bech32Polymod(bech32HrpExpand(hrp).concat(data)) !== 0x2bc830a3) return null;
    var payload = bech32ConvertBits(data.slice(0, data.length - 6), 5, 8, false);
    if (!payload || payload.length !== 32) return null;
    var hex = "";
    for (var b = 0; b < payload.length; b++) hex += payload[b].toString(16).padStart(2, "0");
    return hex;
  }

  // sanitizeName — an optional recipient display name from data-name. Hard-sanitized (strip control
  // chars, collapse whitespace, trim, cap at 64) to match src/lib/embed.ts normalizeDisplayName;
  // rendered only via escapeHtml, never as raw markup. Returns the clean text or null.
  function sanitizeName(raw) {
    if (raw == null) return null;
    var s = String(raw).replace(/\s+/g, " ").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim().slice(0, 64);
    return s === "" ? null : s;
  }

  function parseConfig(a) {
    a = a || {};
    var recipientPh = addressToPuzzleHash(a.recipient);
    if (!recipientPh) {
      return { ok: false, reason: 'The tip widget needs a valid Chia address (data-recipient="xch1…").' };
    }
    var asset = parseAsset(a.asset);
    if (!asset) {
      return { ok: false, reason: 'The tip widget needs data-asset="xch" or a 64-hex CAT asset id.' };
    }
    var color = normHex(a.color);
    // A custom accent color takes precedence and means the "custom" scheme (heart glyph, no brand).
    var scheme = color ? "custom" : (a.scheme === "purple" ? "purple" : "green");
    var symbol = String(a.symbol == null ? "" : a.symbol).trim();
    return {
      ok: true,
      recipientPh: recipientPh,
      recipientAddress: String(a.recipient).trim(),
      asset: asset,
      scheme: scheme,
      color: color,
      symbol: symbol || null,
      name: sanitizeName(a.name),
      presets: parsePresets(a.presets, asset.kind === "xch") || defaultPresets(asset),
      label: (a.label && String(a.label).trim()) || defaultLabel(asset, symbol),
      align: parseAlign(a.align),
      size: parseSize(a.size),
      variant: parseVariant(a.variant),
      locale: resolveWidgetLocale(a.locale),
    };
  }

  // ── Styles (injected once, namespaced .xt-*). ───────────────────────────────────────────────────
  function injectStyles(scheme) {
    if (GLOBAL.styled) return;
    GLOBAL.styled = true;
    var css = [
      ".xt-wrap{display:block;max-width:100%;text-align:center}",
      ".xt-wrap.xt-align-left{text-align:left}.xt-wrap.xt-align-right{text-align:right}",
      ".xt-btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;width:auto;max-width:100%;",
      "margin:5px;white-space:nowrap;vertical-align:middle;cursor:pointer;padding:10px 20px;border-radius:999px;",
      "font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#fff;",
      "transition:transform .12s ease,box-shadow .12s ease}",
      ".xt-btn:hover{transform:translateY(-1px)}",
      ".xt-btn:focus-visible{outline:2px solid #000;outline-offset:2px}",
      /* data-size=lg: a prominent button for a dedicated tip PAGE (additive; default size unchanged). */
      ".xt-btn.xt-lg{gap:11px;padding:15px 30px;font-size:17px}",
      ".xt-btn.xt-lg .xt-heart,.xt-btn.xt-lg .xt-glyph{font-size:17px}",
      /* data-variant=compact: a smaller inline pill. */
      ".xt-btn.xt-compact{gap:6px;padding:7px 14px;font-size:13px}",
      ".xt-btn.xt-compact .xt-heart,.xt-btn.xt-compact .xt-glyph{font-size:13px}",
      /* data-variant=pill: a ghost/outline button (transparent, accent border via inline box-shadow). */
      ".xt-btn.xt-pill{background:transparent!important}",
      ".xt-btn.xt-pill:hover{background:rgba(0,0,0,.04)!important}",
      /* data-variant=inline: a minimal inline text link. */
      ".xt-btn.xt-inline{margin:0;padding:2px 4px;gap:5px;border-radius:6px;background:transparent!important;box-shadow:none!important;font-size:inherit;text-decoration:underline;text-underline-offset:2px}",
      ".xt-btn.xt-inline:hover{transform:none;background:rgba(0,0,0,.04)!important}",
      /* data-variant=banner: a full-width bar with a pitch on the left + the button on the right. */
      ".xt-banner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;",
      "box-sizing:border-box;width:100%;padding:16px 20px;border-radius:14px;background:#12241f;color:#eef4f0;",
      "border:1px solid #1e3630;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".xt-banner-text{display:flex;flex-direction:column;gap:2px;text-align:left;min-width:0}",
      ".xt-banner-text strong{font-size:15px;font-weight:700;color:#fff}",
      ".xt-banner-text span{font-size:12.5px;color:#a6bcb3}",
      ".xt-banner .xt-btn{margin:0;flex:0 0 auto}",
      ".xt-heart{font-size:15px;line-height:1}",
      ".xt-glyph{display:inline-block;width:1em;height:1em;line-height:1;flex:0 0 auto;vertical-align:-.125em}",
      ".xt-btn-label{display:inline-block}",
      /* data-variant=card: a self-contained tip card wrapping the button. */
      ".xt-card{display:inline-block;box-sizing:border-box;position:relative;overflow:hidden;text-align:center;",
      "max-width:320px;width:100%;padding:22px 22px 20px;border-radius:16px;background:#12241f;color:#eef4f0;",
      "border:1px solid #1e3630;box-shadow:0 18px 50px rgba(0,0,0,.4);",
      "font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".xt-card-bar{position:absolute;top:0;left:0;right:0;height:4px}",
      ".xt-card-eyebrow{margin:2px 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--xt-accent,#57e39a)}",
      ".xt-card-title{margin:0 0 8px;font-size:18px;font-weight:700;color:#fff}",
      ".xt-card-addr{margin:0 auto 16px;font-family:ui-monospace,'JetBrains Mono',Menlo,Consolas,monospace;font-size:12px;color:#a6bcb3;word-break:break-all}",
      ".xt-card .xt-btn{margin:0}",
      ".xt-card-note{margin:14px 0 0;font-size:11.5px;line-height:1.5;color:#6f8880}",
      ".xt-scrim{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;",
      "background:rgba(11,10,18,.62);backdrop-filter:blur(3px);padding:20px;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}",
      ".xt-modal{position:relative;width:100%;max-width:380px;box-sizing:border-box;background:#fff;color:#1a1430;",
      "border-radius:18px;padding:26px 24px 24px;box-shadow:0 30px 70px rgba(0,0,0,.45);overflow:hidden}",
      ".xt-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}",
      ".xt-close{position:absolute;top:14px;right:16px;all:unset;cursor:pointer;font-size:22px;line-height:1;color:#9a93ad}",
      ".xt-close:hover{color:#1a1430}",
      ".xt-mark{font-size:13px;font-weight:700;letter-spacing:.04em}",
      ".xt-title{margin:6px 0 2px;font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px}",
      ".xt-sub{margin:0 0 18px;font-size:13.5px;line-height:1.5;color:#6b6580}",
      ".xt-amounts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}",
      ".xt-amount{all:unset;box-sizing:border-box;cursor:pointer;flex:1 1 auto;min-width:64px;text-align:center;",
      "padding:11px 8px;border-radius:11px;border:1.5px solid #e6e1f2;font-size:14px;font-weight:600;color:#3a3450;transition:border-color .14s,background .14s,color .14s}",
      ".xt-amount:hover{border-color:#c9bdf0}",
      ".xt-custom-row{display:flex;align-items:center;gap:8px;margin-bottom:14px}",
      ".xt-input{flex:1;box-sizing:border-box;padding:11px 12px;border-radius:11px;border:1.5px solid #e6e1f2;font:inherit;font-size:15px;color:#1a1430}",
      ".xt-input:focus{outline:none}",
      ".xt-unit{font-size:13px;font-weight:600;color:#6b6580}",
      ".xt-actions{display:flex;gap:10px;margin-top:8px}",
      ".xt-action{all:unset;box-sizing:border-box;cursor:pointer;text-align:center;flex:1;padding:12px;border-radius:12px;font-size:14px;font-weight:600;transition:opacity .14s}",
      ".xt-action[disabled]{opacity:.5;cursor:not-allowed}",
      ".xt-secondary{border:1.5px solid #e6e1f2;color:#3a3450}",
      ".xt-note{margin:14px 0 0;font-size:12px;color:#9a93ad;text-align:center;line-height:1.5}",
      ".xt-fee{margin:12px 0 0;font-size:11px;color:#b3adc0;text-align:center;line-height:1.4}",
      ".xt-balance{margin:0 0 12px;font-size:12.5px;color:#6b6580;text-align:center;font-weight:600}",
      ".xt-getdig{margin:10px 0 0;font-size:12px;color:#6b6580;text-align:center;line-height:1.5}",
      ".xt-getdig a{font-weight:600;text-decoration:none}",
      ".xt-disconnect{all:unset;box-sizing:border-box;cursor:pointer;display:block;margin:14px auto 0;font-size:11px;color:#9a93ad;text-decoration:underline;text-underline-offset:2px}",
      ".xt-disconnect:hover{color:#1a1430}",
      ".xt-note a{text-decoration:none}",
      ".xt-qr{display:flex;flex-direction:column;align-items:center;gap:14px;padding:6px 0 2px}",
      ".xt-qr canvas{width:200px;height:200px;border-radius:12px;background:#fff;border:1px solid #eee}",
      ".xt-copy{all:unset;box-sizing:border-box;cursor:pointer;padding:9px 16px;border-radius:10px;border:1.5px solid #e6e1f2;font-size:13px;font-weight:600;color:#3a3450}",
      ".xt-spinner{width:38px;height:38px;border-radius:50%;border:3px solid rgba(0,0,0,.14);animation:xt-spin .9s linear infinite;margin:8px auto}",
      "@keyframes xt-spin{to{transform:rotate(360deg)}}",
      ".xt-center{text-align:center;padding:6px 0}",
      ".xt-err{color:#c0264a;font-size:13.5px;line-height:1.5;margin:6px 0 14px}",
      ".xt-done-heart{font-size:42px;display:block;text-align:center;margin:6px 0 4px}",
      "@media (prefers-reduced-motion:reduce){.xt-spinner{animation:none}}",
    ].join("");
    var style = document.createElement("style");
    style.id = "xt-styles";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ── CDN loaders (memoised). ─────────────────────────────────────────────────────────────────────
  function loadWalletConnect() {
    if (!GLOBAL.wc) {
      GLOBAL.wc = import(/* @vite-ignore */ WC_CDN)
        .then(function (m) { return m.default || m.SignClient || m; })
        .catch(function () { GLOBAL.wc = null; throw new Error("Could not load the wallet connector. Check your connection."); });
    }
    return GLOBAL.wc;
  }
  function widgetAssetBase() {
    if (GLOBAL.assetBase != null) return GLOBAL.assetBase;
    var origin = "";
    try { var el = selfScript(); if (el && el.src) origin = new URL(el.src).origin; } catch (_) {}
    GLOBAL.assetBase = origin;
    return origin;
  }
  function chiaVendorBase() { return widgetAssetBase() + CHIA_VENDOR; }

  // Manually perform the wasm-bindgen bundler step for the SELF-HOSTED chia-wallet-sdk-wasm build.
  function loadChia() {
    if (!GLOBAL.chia) {
      GLOBAL.chia = (async function () {
        var base = chiaVendorBase();
        var glueUrl = base + "/" + CHIA_GLUE_FILE;
        var wasmUrl = base + "/" + CHIA_WASM_FILE;
        var glue;
        try { glue = await import(/* @vite-ignore */ glueUrl); }
        catch (e) { throw new Error("Could not load the payment engine (glue module): " + ((e && e.message) || e)); }
        if (typeof glue.__wbg_set_wasm !== "function") {
          throw new Error("Could not load the payment engine: the wasm glue is missing __wbg_set_wasm.");
        }
        var buf;
        try {
          var res = await fetch(wasmUrl);
          if (!res.ok) throw new Error("HTTP " + res.status);
          buf = await res.arrayBuffer();
        } catch (e) { throw new Error("Could not load the payment engine (wasm binary): " + ((e && e.message) || e)); }
        var instance;
        try {
          var module = await WebAssembly.compile(buf);
          var imports = {};
          var descs = WebAssembly.Module.imports(module);
          for (var i = 0; i < descs.length; i++) imports[descs[i].module] = glue;
          var result = await WebAssembly.instantiate(module, imports);
          instance = result.instance || result;
        } catch (e) { throw new Error("Could not load the payment engine (wasm instantiate): " + ((e && e.message) || e)); }
        glue.__wbg_set_wasm(instance.exports);
        if (typeof instance.exports.__wbindgen_start === "function") instance.exports.__wbindgen_start();
        return glue;
      })().catch(function (e) { GLOBAL.chia = null; throw e instanceof Error ? e : new Error("Could not load the payment engine: " + e); });
    }
    return GLOBAL.chia;
  }

  // ── WalletConnect — the widget's OWN session. ──────────────────────────────────────────────────
  function makeWallet(projectId, assetBase) {
    var client = null;
    var topic = null;
    async function getClient() {
      if (client) return client;
      var SignClient = await loadWalletConnect();
      client = await SignClient.init({
        projectId: projectId,
        customStoragePrefix: "xch-tip",
        metadata: {
          name: "xchtip.app Tip",
          description: "Tip this recipient on Chia.",
          url: assetBase,
          icons: [assetBase + "/favicon.svg"],
        },
      });
      return client;
    }
    async function restore() {
      try {
        var c = await getClient();
        var sessions = c.session && typeof c.session.getAll === "function" ? c.session.getAll() : [];
        var now = Math.floor(Date.now() / 1000);
        for (var i = sessions.length - 1; i >= 0; i--) {
          var s = sessions[i];
          if (s && s.topic && s.namespaces && s.namespaces.chia && (!s.expiry || s.expiry > now + 30)) { topic = s.topic; return s; }
        }
      } catch (_) {}
      return null;
    }
    async function connect() {
      var c = await getClient();
      var res = await c.connect({ optionalNamespaces: { chia: { methods: WC_METHODS, chains: [CHAIN], events: [] } } });
      return {
        uri: res.uri,
        approval: async function () { var session = await res.approval(); topic = session.topic; return session; },
      };
    }
    async function request(method, params) {
      var c = await getClient();
      var t;
      var timeout = new Promise(function (_, rej) { t = setTimeout(function () { rej(new Error("Your wallet didn't respond — open your wallet app and try again.")); }, 60000); });
      try {
        return await Promise.race([c.request({ topic: topic, chainId: CHAIN, request: { method: method, params: params } }), timeout]);
      } finally { clearTimeout(t); }
    }
    // Disconnect the current WalletConnect session so the user can connect a different wallet. Best
    // effort: tells the relay to close, then forgets the topic locally regardless of the relay result.
    async function disconnect() {
      var t = topic;
      topic = null;
      if (!t) return;
      try {
        var c = await getClient();
        await c.disconnect({ topic: t, reason: { code: 6000, message: "User disconnected" } });
      } catch (_) { /* already gone / relay error — the local topic is cleared either way */ }
    }
    return { connect: connect, restore: restore, request: request, disconnect: disconnect, getTopic: function () { return topic; } };
  }

  // ── Spend helpers (chia from wasm, coins via WC, parents/broadcast via coinset). ─────────────────
  function bytesToHex(bytes) { var out = ""; for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0"); return out; }
  function hex0xToBytes(h) { var s = strip0x(h); var out = new Uint8Array(s.length / 2); for (var i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16); return out; }
  async function coinsetPost(path, body) {
    var res = await fetch(COINSET + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json().catch(function () { return {}; });
  }
  function fix0x(h) { return h && !String(h).startsWith("0x") ? "0x" + h : h; }
  // Coin amounts from the wasm are BigInt → Number (JSON.stringify throws on BigInt).
  function toNum(v) { return typeof v === "bigint" ? Number(v) : Number(v); }
  // The wasm CoinSpend returns parentCoinInfo / puzzleHash / puzzleReveal / solution as BYTE objects
  // (Uint8Array), not strings. The wallet's chip0002_signCoinSpends + coinset /push_tx require HEX
  // STRINGS — a raw byte object serializes to `{}` and the wallet rejects it ("Expected string,
  // received object"). Coerce any bytes-like value to a 0x-prefixed lowercase hex string here.
  function toHexStr(v) {
    if (v == null) return v;
    if (typeof v === "string") return fix0x(v);
    if (v instanceof Uint8Array) return "0x" + bytesToHex(v);
    if (typeof v.toHex === "function") { try { return fix0x(v.toHex()); } catch (_) {} }
    if (typeof v.length === "number") { try { return "0x" + bytesToHex(v); } catch (_) {} } // array-like
    return v;
  }
  function coinSpendToWallet(cs) {
    return {
      coin: {
        parent_coin_info: toHexStr(cs.coin.parent_coin_info != null ? cs.coin.parent_coin_info : cs.coin.parentCoinInfo),
        puzzle_hash: toHexStr(cs.coin.puzzle_hash != null ? cs.coin.puzzle_hash : cs.coin.puzzleHash),
        amount: toNum(cs.coin.amount),
      },
      puzzle_reveal: toHexStr(cs.puzzle_reveal != null ? cs.puzzle_reveal : cs.puzzleReveal),
      solution: toHexStr(cs.solution),
    };
  }


  // Recover the 48-byte synthetic pk (Uint8Array) from a STANDARD p2 puzzle reveal by uncurrying: the
  // standard puzzle is curried with ONE argument, the synthetic public key. This mirrors the proven
  // hub lib/chia-address.ts syntheticPkHexFromCoinPuzzle (verified against the real wasm). The reveal
  // MUST be the bare standard p2 puzzle — callers read it from the wallet's XCH standard coins (never
  // a CAT coin, whose puzzle may be the outer CAT wrapper).
  function recoverSyntheticPk(chia, clvm, puzzleRevealHex) {
    var prog = clvm.deserialize(chia.fromHex(strip0x(puzzleRevealHex)));
    var curried = prog.uncurry ? prog.uncurry() : null;
    if (!curried) return null;
    var args = null;
    try { args = typeof curried.args === "function" ? curried.args() : curried.args; } catch (_) { args = null; }
    if ((!args || !args.length) && curried.getArgs) { try { args = curried.getArgs(); } catch (_) {} }
    if (!args || !args.length) return null;
    var first = args[0];
    if (!first) return null;
    if (typeof first.toAtom === "function") { try { return first.toAtom(); } catch (_) {} }
    if (typeof first.toBytes === "function") { try { return first.toBytes(); } catch (_) {} }
    return null;
  }

  // Build unsigned XCH coin spends sending `mojos` to `recipientPh`. Returns { coin_spends }.
  async function buildXchPayment(wallet, recipientPh, mojos) {
    var chia = await loadChia();
    var clvm = new chia.Clvm();
    var need = BigInt(mojos);
    var recipient = strip0x(recipientPh);

    var entries = (await wallet.request("chip0002_getAssetCoins", { type: null, assetId: null, includedLocked: false, offset: 0, limit: 200 })) || [];
    var coins = Array.isArray(entries) ? entries : (entries.coins || []);
    if (!coins.length) throw new Error("Your wallet holds no XCH. Add XCH and try again.");

    // Every spendable XCH coin the wallet returns is ours — select across ALL of them (they may live
    // at many HD addresses / synthetic keys), NOT just one address. Each coin carries its OWN standard
    // puzzle reveal, from which we recover that coin's OWN synthetic key to sign it. Change returns to
    // the first selected coin's own address.
    function prOf(e) { return (e && (e.puzzle || e.puzzleReveal || e.puzzle_reveal)) || null; }
    var spendable = coins.filter(function (e) {
      if (!prOf(e)) return false;
      if (((e.spent_block_index != null ? e.spent_block_index : e.spentBlockIndex) || 0) !== 0 || e.locked) return false;
      return true;
    });
    if (!spendable.length) throw new Error("Your wallet didn't return spendable XCH coins. Reconnect and try again.");
    spendable.sort(function (a, b) { return (BigInt(b.coin.amount) - BigInt(a.coin.amount) > 0n ? 1 : -1); });

    var total = 0n;
    for (var t = 0; t < spendable.length; t++) total += BigInt(spendable[t].coin.amount);

    var selected = [];
    var sum = 0n;
    for (var i = 0; i < spendable.length && sum < need; i++) { selected.push(spendable[i]); sum += BigInt(spendable[i].coin.amount); }
    if (sum < need) throw new Error("Not enough XCH: need " + (Number(need) / XCH_MOJOS_PER_XCH) + " XCH, have " + (Number(total) / XCH_MOJOS_PER_XCH) + " XCH.");
    var change = sum - need;

    // Recover the FIRST selected coin's key/address — change (+ the outputs are made on coin 0) go here.
    var lead = readSenderKeyFromReveal(chia, clvm, prOf(selected[0]));
    if (!lead) throw new Error("Could not read your wallet's signing key from its coins.");
    var leadPhBytes = chia.fromHex(lead.innerPh);

    // 0.1% protocol fee → the fee address; the recipient gets the remainder. No fee coin if too small.
    var split = splitFee(need);
    var feePh = addressToPuzzleHash(FEE_ADDRESS);

    for (var j = 0; j < selected.length; j++) {
      var e = selected[j];
      var coin = new chia.Coin(
        hex0xToBytes(e.coin.parent_coin_info != null ? e.coin.parent_coin_info : e.coin.parentCoinInfo),
        hex0xToBytes(e.coin.puzzle_hash != null ? e.coin.puzzle_hash : e.coin.puzzleHash),
        BigInt(e.coin.amount)
      );
      // Each coin is signed with ITS OWN synthetic key (coins may span HD addresses).
      var signer = j === 0 ? lead : (readSenderKeyFromReveal(chia, clvm, prOf(e)) || lead);
      var conditions = [];
      if (j === 0) {
        conditions.push(clvm.createCoin(chia.fromHex(recipient), split.net, clvm.nil()));
        if (split.fee > 0n && feePh) conditions.push(clvm.createCoin(chia.fromHex(feePh), split.fee, clvm.nil()));
        if (change > 0n) conditions.push(clvm.createCoin(leadPhBytes, change, clvm.nil()));
      }
      var delegated = clvm.delegatedSpend(conditions);
      clvm.spendStandardCoin(coin, signer.pk, delegated);
    }
    var wasmCoinSpends = clvm.coinSpends();
    return { coin_spends: wasmCoinSpends.map(coinSpendToWallet) };
  }

  // Recover { pk, innerPh } from a single standard puzzle reveal (per-coin key). Returns null if the
  // reveal isn't a standard p2 puzzle.
  function readSenderKeyFromReveal(chia, clvm, puzzleRevealHex) {
    if (!puzzleRevealHex) return null;
    var pkBytes = recoverSyntheticPk(chia, clvm, puzzleRevealHex);
    if (!pkBytes || pkBytes.length !== 48) return null;
    var pk = chia.PublicKey.fromBytes(pkBytes);
    var innerPhBytes = chia.standardPuzzleHash ? chia.standardPuzzleHash(pk) : clvm.standardPuzzle(pk).puzzleHash();
    return { pk: pk, innerPh: strip0x(chia.toHex(innerPhBytes)) };
  }

  // Build unsigned CAT coin spends sending `baseUnits` of `assetId` to `recipientPh`. Faithful port of
  // the hub dig-tip.js DIG-CAT ring spend, generalized to any asset id. Returns { coin_spends }.
  async function buildCatPayment(wallet, assetId, recipientPh, baseUnits) {
    var chia = await loadChia();
    var clvm = new chia.Clvm();
    var need = BigInt(baseUnits);
    var recipient = strip0x(recipientPh);
    var assetIdBytes = chia.fromHex(strip0x(assetId));

    var entries = (await wallet.request("chip0002_getAssetCoins", { type: "cat", assetId: strip0x(assetId), includedLocked: false, offset: 0, limit: 200 })) || [];
    var coins = Array.isArray(entries) ? entries : (entries.coins || []);
    if (!coins.length) throw new Error("Your wallet holds none of that token. Add it and try again.");

    // Resolve EACH CAT coin's owning key — CATs may live at several HD addresses, so a single
    // sender key would miss coins ("Not enough" despite a funded wallet — the multi-address bug).
    // Two sources, both VALIDATED by recomputing the coin's CAT outer puzzle hash:
    //   (a) the coin's own `puzzle` reveal (wallets that return the inner p2 reveal for CAT coins);
    //   (b) a map of keys recovered from the wallet's XCH standard coins → their CAT outer hashes
    //       (the hub's proven strategy, generalized to every recoverable key).
    function prOf(e) { return (e && (e.puzzle || e.puzzleReveal || e.puzzle_reveal)) || null; }
    function outerPhFor(innerPh) { return strip0x(chia.toHex(chia.catPuzzleHash(assetIdBytes, chia.fromHex(innerPh)))); }

    // (b) key map from XCH coins: CAT outer ph (hex) → { pk, innerPh }.
    var keyByOuterPh = {};
    try {
      var xchEntries = (await wallet.request("chip0002_getAssetCoins", { type: null, assetId: null, includedLocked: false, offset: 0, limit: 200 })) || [];
      var xchCoins = Array.isArray(xchEntries) ? xchEntries : (xchEntries.coins || []);
      var seenInner = {};
      for (var xk = 0; xk < xchCoins.length; xk++) {
        var key = readSenderKeyFromReveal(chia, clvm, prOf(xchCoins[xk]));
        if (!key || seenInner[key.innerPh]) continue;
        seenInner[key.innerPh] = true;
        keyByOuterPh[outerPhFor(key.innerPh)] = key;
      }
    } catch (_) { /* no XCH coins — path (a) may still resolve keys */ }

    // Attach a key to every spendable CAT coin (skip coins whose key we cannot recover).
    var spendable = [];
    for (var ci = 0; ci < coins.length; ci++) {
      var entry = coins[ci];
      if (((entry.spent_block_index != null ? entry.spent_block_index : entry.spentBlockIndex) || 0) !== 0 || entry.locked) continue;
      var outerPh = strip0x((entry.coin && (entry.coin.puzzle_hash || entry.coin.puzzleHash)) || "");
      var coinKey = null;
      // (a) the coin's own reveal, validated against its outer hash.
      var own = readSenderKeyFromReveal(chia, clvm, prOf(entry));
      if (own && outerPhFor(own.innerPh) === outerPh) coinKey = own;
      // (b) the XCH-derived key map.
      if (!coinKey && keyByOuterPh[outerPh]) coinKey = keyByOuterPh[outerPh];
      if (coinKey) spendable.push({ entry: entry, key: coinKey });
    }
    if (!spendable.length) {
      throw new Error("Could not read your wallet's signing key for this token. Make sure your wallet also holds a little XCH, then try again.");
    }
    spendable.sort(function (a, b) { return (BigInt(b.entry.coin.amount) - BigInt(a.entry.coin.amount) > 0n ? 1 : -1); });

    var total = 0n;
    for (var ti = 0; ti < spendable.length; ti++) total += BigInt(spendable[ti].entry.coin.amount);

    var selected = [];
    var sum = 0n;
    for (var i = 0; i < spendable.length && sum < need; i++) { selected.push(spendable[i]); sum += BigInt(spendable[i].entry.coin.amount); }
    if (sum < need) throw new Error("Not enough of that token: need " + (Number(need) / CAT_BASE_UNITS) + ", have " + (Number(total) / CAT_BASE_UNITS) + ".");
    var change = sum - need;
    var leadKey = selected[0].key; // outputs + change ride on the first coin's key/address

    var catSpends = [];
    for (var j = 0; j < selected.length; j++) {
      var e = selected[j].entry;
      var coinKey = selected[j].key; // this coin's OWN inner key (coins may span HD addresses)
      var wasmChildCoin = new chia.Coin(
        hex0xToBytes(e.coin.parent_coin_info != null ? e.coin.parent_coin_info : e.coin.parentCoinInfo),
        hex0xToBytes(e.coin.puzzle_hash != null ? e.coin.puzzle_hash : e.coin.puzzleHash),
        BigInt(e.coin.amount)
      );
      var childIdHex = bytesToHex(wasmChildCoin.coinId());
      var recJson = await coinsetPost("/get_coin_record_by_name", { name: fix0x(childIdHex) });
      var rec = recJson.coin_record;
      var confirmedHeight = rec ? Number(rec.confirmed_block_index || 0) : 0;
      if (confirmedHeight <= 0) throw new Error("A coin isn't confirmed on-chain yet — try again shortly.");
      var parentIdHex = bytesToHex(wasmChildCoin.parentCoinInfo);
      var psJson = await coinsetPost("/get_puzzle_and_solution", { coin_id: fix0x(parentIdHex), height: confirmedHeight });
      var ps = psJson.coin_solution;
      if (!ps || !ps.coin) throw new Error("Could not fetch a parent spend for a coin.");

      var parentPuzzleBytes = chia.fromHex(strip0x(ps.puzzle_reveal || ps.puzzleReveal || ""));
      var parentProgram = clvm.deserialize(parentPuzzleBytes);
      var parsedParentCat = parentProgram.puzzle().parseCatInfo();
      var parentInnerPhBytes = (parsedParentCat && parsedParentCat.info && parsedParentCat.info.p2PuzzleHash)
        ? parsedParentCat.info.p2PuzzleHash : chia.fromHex(coinKey.innerPh);
      var parentCoin = new chia.Coin(
        hex0xToBytes(ps.coin.parent_coin_info != null ? ps.coin.parent_coin_info : ps.coin.parentCoinInfo),
        hex0xToBytes(ps.coin.puzzle_hash != null ? ps.coin.puzzle_hash : ps.coin.puzzleHash),
        BigInt(ps.coin.amount)
      );
      var lineageProof = new chia.LineageProof(parentCoin.parentCoinInfo, parentInnerPhBytes, parentCoin.amount);
      // The Cat's inner puzzle hash is THIS coin's address (each coin reconstructs its own outer puzzle).
      var catInfo = new chia.CatInfo(assetIdBytes, undefined, chia.fromHex(coinKey.innerPh));
      var cat = new chia.Cat(wasmChildCoin, lineageProof, catInfo);

      var conditions = [];
      if (j === 0) {
        var recipientPhBytes = chia.fromHex(recipient);
        var memoProgram = clvm.list([clvm.atom(recipientPhBytes)]);
        // 0.1% protocol fee → the fee address (a CAT coin of the same asset). Recipient gets the rest.
        var catSplit = splitFee(need);
        var catFeePh = addressToPuzzleHash(FEE_ADDRESS);
        conditions.push(clvm.createCoin(recipientPhBytes, catSplit.net, memoProgram));
        if (catSplit.fee > 0n && catFeePh) {
          var feePhBytes = chia.fromHex(catFeePh);
          var feeMemo = clvm.list([clvm.atom(feePhBytes)]);
          conditions.push(clvm.createCoin(feePhBytes, catSplit.fee, feeMemo));
        }
        if (change > 0n) conditions.push(clvm.createCoin(chia.fromHex(leadKey.innerPh), change));
      }
      var delegated = clvm.delegatedSpend(conditions);
      // Each coin's inner spend is signed by ITS OWN synthetic key.
      var innerSpend = clvm.standardSpend(coinKey.pk, delegated);
      catSpends.push(new chia.CatSpend(cat, innerSpend));
    }
    clvm.spendCats(catSpends);
    return { coin_spends: clvm.coinSpends().map(coinSpendToWallet) };
  }

  async function buildPayment(wallet, cfg, amount) {
    var base = amountToBaseUnits(cfg.asset, amount);
    if (cfg.asset.kind === "xch") return buildXchPayment(wallet, cfg.recipientPh, base);
    return buildCatPayment(wallet, cfg.asset.assetId, cfg.recipientPh, base);
  }

  async function signAndSend(wallet, coin_spends) {
    var resp = await wallet.request("chip0002_signCoinSpends", { coinSpends: coin_spends, partialSign: true });
    var sig = typeof resp === "string" ? resp : (resp && (resp.signature || resp.aggregatedSignature || resp.aggregated_signature)) || "";
    if (!sig) throw new Error("Your wallet did not return a signature.");
    var body = {
      spend_bundle: {
        coin_spends: coin_spends.map(function (cs) {
          return {
            coin: { parent_coin_info: fix0x(cs.coin.parent_coin_info), puzzle_hash: fix0x(cs.coin.puzzle_hash), amount: cs.coin.amount },
            puzzle_reveal: fix0x(cs.puzzle_reveal),
            solution: fix0x(cs.solution),
          };
        }),
        aggregated_signature: String(sig).startsWith("0x") ? sig : "0x" + sig,
      },
    };
    var j = await coinsetPost("/push_tx", body);
    var status = j.status || "";
    var ok = j.success === true || status === "SUCCESS" || status === "PENDING";
    if (!ok || j.error) {
      if (/double[_ ]?spend/i.test(j.error || "")) throw new Error("Those coins are already pending. Try again — different coins will be used.");
      throw new Error(j.error || "The network did not accept the tip.");
    }
    return { ok: true };
  }

  // ── QR (drawn locally). ─────────────────────────────────────────────────────────────────────────
  function renderQrInto(slot, uri) {
    var canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 200;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "WalletConnect QR code");
    slot.appendChild(canvas);
    import(/* @vite-ignore */ QR_CDN)
      .then(function (m) {
        var QR = m.default || m;
        var toCanvas = QR.toCanvas || (QR.default && QR.default.toCanvas);
        if (typeof toCanvas === "function") toCanvas(canvas, uri, { width: 200, margin: 1, color: { dark: "#1a1430", light: "#ffffff" } }, function () {});
      })
      .catch(function () {});
  }

  // ── The widget — one instance per <script>. ─────────────────────────────────────────────────────
  function mountWidget(scriptEl, cfg, projectId) {
    var scheme = resolveScheme(cfg.scheme, cfg.color);
    injectStyles(scheme);
    var assetBase = widgetAssetBase() || "https://xchtip.app";
    var unit = assetUnitLabel(cfg.asset, cfg.symbol);
    var glyph = glyphFor(cfg.asset, cfg.scheme);
    var L = cfg.locale; // widget locale for wt() lookups

    var mountTarget = null;
    if (scriptEl.dataset.target) { try { mountTarget = document.querySelector(scriptEl.dataset.target); } catch (_) {} }

    // The trigger button — its class encodes size + variant so the CSS styles each variant. The
    // leading glyph is brand-aware (Chia leaf / DIG mark / heart). Variants that change the button's
    // OWN look (pill=ghost/outline, inline=text link) skip the gradient fill; wrapper variants
    // (banner, card) place the default button inside a larger surface.
    var v = cfg.variant;
    var variantClass = { compact: " xt-compact", pill: " xt-pill", inline: " xt-inline" }[v] || "";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "xt-btn" + (cfg.size === "lg" ? " xt-lg" : "") + variantClass;
    btn.setAttribute("aria-haspopup", "dialog");
    if (v === "pill" || v === "inline") {
      // Ghost / text styles: no gradient fill; the accent tints the border/text.
      btn.style.color = scheme.from;
      if (v === "pill") btn.style.boxShadow = "inset 0 0 0 1.5px " + scheme.from;
    } else {
      btn.style.background = "linear-gradient(135deg," + scheme.from + " 0%," + scheme.to + " 100%)";
      btn.style.color = scheme.text;
      btn.style.boxShadow = "0 6px 18px " + scheme.shadow;
    }
    btn.innerHTML = glyph + '<span class="xt-btn-label">' + escapeHtml(cfg.label) + "</span>";

    var wrap = document.createElement("div");
    wrap.className = "xt-wrap" + (cfg.align === "left" ? " xt-align-left" : cfg.align === "right" ? " xt-align-right" : "");

    if (v === "card") {
      var card = document.createElement("div");
      card.className = "xt-card";
      card.style.setProperty("--xt-accent", scheme.from);
      // Show the FULL recipient address (never truncated — truncation would let an attacker pass off a
      // lookalike address matching the visible head+tail). It wraps within the card.
      card.innerHTML =
        '<div class="xt-card-bar" style="background:linear-gradient(90deg,' + scheme.from + "," + scheme.to + ')"></div>' +
        '<div class="xt-card-eyebrow">Tip in ' + escapeHtml(unit) + "</div>" +
        '<div class="xt-card-title">' + escapeHtml(cfg.name ? cfg.name : "Support this creator") + "</div>" +
        '<div class="xt-card-addr" title="' + escapeHtml(cfg.recipientAddress) + '">' + escapeHtml(cfg.recipientAddress) + "</div>";
      card.appendChild(btn);
      card.insertAdjacentHTML("beforeend", '<div class="xt-card-note">On-chain, wallet to wallet. Includes a 0.1% fee to xchtip.app.</div>');
      wrap.appendChild(card);
    } else if (v === "banner") {
      // A full-width bar: a short pitch on the left, the button on the right.
      var banner = document.createElement("div");
      banner.className = "xt-banner";
      banner.style.setProperty("--xt-accent", scheme.from);
      var pitch = document.createElement("div");
      pitch.className = "xt-banner-text";
      pitch.innerHTML = '<strong>' + escapeHtml(cfg.name ? cfg.name : "Support this creator") + '</strong><span>Tip in ' + escapeHtml(unit) + " on Chia — wallet to wallet.</span>";
      banner.appendChild(pitch);
      banner.appendChild(btn);
      wrap.appendChild(banner);
    } else {
      wrap.appendChild(btn);
    }

    if (mountTarget) mountTarget.appendChild(wrap);
    else if (scriptEl.parentNode) scriptEl.parentNode.insertBefore(wrap, scriptEl.nextSibling);
    else document.body.appendChild(wrap);

    var wallet = null;
    var state = { status: "idle", topic: null, amount: cfg.presets[0] || 1, useCustom: false, prepared: null, error: null, uri: null, customAmount: "", balance: null };

    // Fetch the connected wallet's spendable balance for the tip asset (whole units), for display on
    // the amount screen so the tipper sees what they hold. Best-effort: null on any failure. Sums
    // chip0002_getAssetCoins (the method already in the negotiated WC set — NOT getAssetBalance, which
    // Sage rejects as unsupported).
    async function fetchBalance() {
      try {
        var isXch = cfg.asset.kind === "xch";
        var perUnit = isXch ? XCH_MOJOS_PER_XCH : CAT_BASE_UNITS;
        var params = isXch ? { type: null, assetId: null } : { type: "cat", assetId: cfg.asset.assetId };
        var entries = (await wallet.request("chip0002_getAssetCoins", { type: params.type, assetId: params.assetId, includedLocked: false, offset: 0, limit: 200 })) || [];
        var coins = Array.isArray(entries) ? entries : (entries.coins || []);
        var sum = 0n;
        for (var i = 0; i < coins.length; i++) { try { sum += BigInt(coins[i].coin.amount); } catch (_) {} }
        state.balance = Number(sum) / perUnit;
      } catch (_) { state.balance = null; }
      if (scrim && state.status === "pick") render();
    }
    var scrim = null;

    function accentStyle() { return "color:#fff;background:linear-gradient(135deg," + scheme.from + "," + scheme.to + ");box-shadow:0 6px 16px " + scheme.shadow; }
    function currentAmount() { return state.useCustom ? (parseAmount(state.customAmount) || 0) : state.amount; }
    function amountLabel(n) { return n + " " + unit; }

    function close() {
      if (scrim && scrim.parentNode) scrim.parentNode.removeChild(scrim);
      scrim = null; state.status = "idle"; state.prepared = null; state.error = null; btn.focus();
    }

    function render() {
      if (!scrim) {
        scrim = document.createElement("div");
        scrim.className = "xt-scrim";
        scrim.setAttribute("role", "dialog");
        scrim.setAttribute("aria-modal", "true");
        scrim.setAttribute("aria-label", wt(L, "title"));
        scrim.addEventListener("click", function (e) { if (e.target === scrim && state.status !== "signing") close(); });
        document.body.appendChild(scrim);
      }
      var closeBtn = state.status === "signing" ? "" : '<button class="xt-close" data-act="close" aria-label="' + escapeHtml(wt(L, "close")) + '">×</button>';
      var header =
        '<div class="xt-mark" style="color:' + scheme.from + '">xchtip.app</div>' +
        '<div class="xt-title"><span class="xt-heart" aria-hidden="true" style="color:' + scheme.from + '">♥</span>' + escapeHtml(wt(L, "title")) + "</div>";
      var body = "";

      if (state.status === "connecting" || state.status === "pairing") {
        if (state.uri) {
          body =
            '<p class="xt-sub">' + escapeHtml(wt(L, "connectSub")) + "</p>" +
            '<div class="xt-qr"><div id="xt-qrslot"></div><button class="xt-copy" data-act="copy">' + escapeHtml(wt(L, "copyLink")) + "</button></div>" +
            '<p class="xt-note">' + escapeHtml(wt(L, "noWallet")) + ' <a href="' + SAGE_WALLET_URL + '" target="_blank" rel="noopener noreferrer" style="color:' + scheme.from + '">' + escapeHtml(wt(L, "getSage")) + "</a></p>";
        } else {
          body = '<div class="xt-center"><div class="xt-spinner" style="border-top-color:' + scheme.from + '"></div><p class="xt-sub">' + escapeHtml(wt(L, "opening")) + "</p></div>";
        }
      } else if (state.status === "pick") {
        var chips = cfg.presets.map(function (d) {
          var pressed = !state.useCustom && state.amount === d;
          return '<button class="xt-amount" data-act="preset" data-amt="' + d + '" aria-pressed="' + pressed + '"' + (pressed ? ' style="border-color:' + scheme.from + ';background:' + rgbaFromHex(scheme.from, 0.08) + '"' : "") + ">" + amountLabel(d) + "</button>";
        }).join("");
        chips += '<button class="xt-amount" data-act="custom" aria-pressed="' + state.useCustom + '">' + escapeHtml(wt(L, "custom")) + "</button>";
        var customRow = state.useCustom
          ? '<div class="xt-custom-row"><input class="xt-input" type="number" min="0" step="any" placeholder="' + escapeHtml(wt(L, "enterAmount")) + '" value="' + escapeHtml(state.customAmount) + '" data-act="custominput" aria-label="' + escapeHtml(wt(L, "enterAmount")) + '" /><span class="xt-unit">' + unit + '</span></div>'
          : "";
        var amt = currentAmount();
        var balLine = (state.balance != null)
          ? '<p class="xt-balance">' + escapeHtml(wt(L, "balance", { bal: (Math.round(state.balance * 1000) / 1000) + " " + unit })) + "</p>"
          : "";
        body =
          '<p class="xt-sub">' + escapeHtml(wt(L, "pickSub", { unit: unit })) + "</p>" + balLine +
          '<div class="xt-amounts">' + chips + "</div>" + customRow +
          '<div class="xt-actions"><button class="xt-action xt-secondary" data-act="close">' + escapeHtml(wt(L, "cancel")) + "</button>" +
          '<button class="xt-action" style="' + accentStyle() + '" data-act="confirm"' + (amt > 0 ? "" : " disabled") + ">" + escapeHtml(wt(L, "send", { amt: amt > 0 ? amountLabel(amt) : unit })) + " ♥</button></div>" +
          '<p class="xt-fee">' + escapeHtml(wt(L, "fee")) + "</p>" +
          (isDigAsset(cfg.asset) ? getDigHtml(scheme.from, L) : "") +
          '<button class="xt-disconnect" data-act="disconnect">' + escapeHtml(wt(L, "disconnect")) + "</button>";
      } else if (state.status === "preparing") {
        body = '<div class="xt-center"><div class="xt-spinner" style="border-top-color:' + scheme.from + '"></div><p class="xt-sub">' + escapeHtml(wt(L, "preparing", { amt: amountLabel(currentAmount()) })) + "</p></div>";
      } else if (state.status === "sign") {
        body =
          '<p class="xt-sub">' + escapeHtml(wt(L, "approveSub", { amt: amountLabel(currentAmount()) })) + "</p>" +
          '<div class="xt-actions"><button class="xt-action xt-secondary" data-act="backtopick">' + escapeHtml(wt(L, "back")) + "</button>" +
          '<button class="xt-action" style="' + accentStyle() + '" data-act="sign">' + escapeHtml(wt(L, "signSend")) + " ♥</button></div>";
      } else if (state.status === "signing") {
        body = '<div class="xt-center"><div class="xt-spinner" style="border-top-color:' + scheme.from + '"></div><p class="xt-sub">' + escapeHtml(wt(L, "waiting")) + "</p></div>";
      } else if (state.status === "done") {
        body =
          '<span class="xt-done-heart" aria-hidden="true" style="color:' + scheme.from + '">♥</span>' +
          '<p class="xt-sub" style="text-align:center">' + escapeHtml(wt(L, "doneSub", { amt: amountLabel(currentAmount()) })) + "</p>" +
          '<div class="xt-actions"><button class="xt-action" style="' + accentStyle() + '" data-act="close">' + escapeHtml(wt(L, "done")) + "</button></div>";
      } else if (state.status === "error") {
        var lowOnDig = isDigAsset(cfg.asset) && /not enough/i.test(state.error || "");
        body =
          '<p class="xt-err" role="alert">' + escapeHtml(state.error || "Something went wrong.") + "</p>" +
          (lowOnDig ? getDigHtml(scheme.from, L) : "") +
          '<div class="xt-actions"><button class="xt-action xt-secondary" data-act="close">' + escapeHtml(wt(L, "close")) + "</button>" +
          '<button class="xt-action" style="' + accentStyle() + '" data-act="retry">' + escapeHtml(wt(L, "tryAgain")) + "</button></div>";
      }

      scrim.innerHTML = '<div class="xt-modal"><span style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + scheme.from + "," + scheme.to + ')"></span>' + closeBtn + header + body + "</div>";
      if ((state.status === "connecting" || state.status === "pairing") && state.uri) {
        var slot = scrim.querySelector("#xt-qrslot");
        if (slot) renderQrInto(slot, state.uri);
      }
      wireActions();
    }

    function wireActions() {
      var els = scrim.querySelectorAll("[data-act]");
      for (var i = 0; i < els.length; i++) {
        (function (el) {
          var act = el.dataset.act;
          if (act === "custominput") { el.addEventListener("input", function () { state.customAmount = el.value; updateConfirm(); }); return; }
          el.addEventListener("click", function (ev) { ev.preventDefault(); onAction(act, el); });
        })(els[i]);
      }
    }
    function updateConfirm() {
      var confirm = scrim.querySelector('[data-act="confirm"]');
      if (!confirm) return;
      var amt = currentAmount();
      confirm.disabled = !(amt > 0);
      confirm.innerHTML = "Send " + (amt > 0 ? amountLabel(amt) : unit) + " ♥";
    }

    async function onAction(act, el) {
      if (act === "close") return close();
      if (act === "copy") { try { await navigator.clipboard.writeText(state.uri || ""); el.textContent = wt(L, "copied"); setTimeout(function () { el.textContent = wt(L, "copyLink"); }, 1500); } catch (_) {} return; }
      if (act === "preset") { state.useCustom = false; state.amount = Number(el.dataset.amt); render(); return; }
      if (act === "custom") { state.useCustom = true; render(); return; }
      if (act === "backtopick") { state.status = "pick"; state.prepared = null; render(); return; }
      if (act === "retry") { state.status = "pick"; state.error = null; state.prepared = null; render(); return; }
      if (act === "disconnect") return doDisconnect();
      if (act === "confirm") return doPrepare();
      if (act === "sign") return doSign();
    }

    // Disconnect the wallet: drop the WC session + local state, then close the modal. The next tip
    // click starts a fresh connect (the user can pair a different wallet).
    async function doDisconnect() {
      try { if (wallet && wallet.disconnect) await wallet.disconnect(); } catch (_) {}
      wallet = null;
      state.topic = null; state.prepared = null; state.error = null;
      close();
    }

    async function doPrepare() {
      var amount = currentAmount();
      if (amount <= 0) return;
      state.amount = state.useCustom ? amount : state.amount;
      state.status = "preparing"; render();
      try {
        var built = await buildPayment(wallet, cfg, amount);
        state.prepared = built; state.status = "sign"; render();
      } catch (e) { state.status = "error"; state.error = (e && e.message) || "Could not prepare the tip."; render(); }
    }
    async function doSign() {
      state.status = "signing"; render();
      try { await signAndSend(wallet, state.prepared.coin_spends); state.status = "done"; render(); }
      catch (e) { state.status = "error"; state.error = (e && e.message) || "Signing or broadcast failed."; render(); }
    }

    async function open() {
      if (!projectId) {
        state.status = "error";
        state.error = "This tip button needs a WalletConnect projectId. Add data-wc-project-id to the embed snippet (free at cloud.reown.com).";
        render(); return;
      }
      if (state.topic && wallet) { state.status = "pick"; render(); fetchBalance(); return; }
      wallet = wallet || makeWallet(projectId, assetBase);
      try { var existing = await wallet.restore(); if (existing) { state.topic = existing.topic; state.status = "pick"; render(); fetchBalance(); return; } } catch (_) {}
      state.status = "connecting"; render();
      try {
        var pairing = await wallet.connect();
        state.uri = pairing.uri; render();
        var session = await pairing.approval();
        state.topic = session.topic; state.uri = null; state.status = "pick"; render(); fetchBalance();
      } catch (e) { state.status = "error"; state.error = (e && e.message) || "Could not connect your wallet."; render(); }
    }

    btn.addEventListener("click", open);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && scrim && state.status !== "signing") close(); });
  }

  // ── Boot. ───────────────────────────────────────────────────────────────────────────────────────
  function selfScript() {
    if (document.currentScript) return document.currentScript;
    var s = document.querySelectorAll('script[src*="xch-tip.js"]');
    return s.length ? s[s.length - 1] : null;
  }
  function boot() {
    var el = selfScript();
    if (!el) return;
    GLOBAL.loadChia = loadChia; // exposed for the wasm-init e2e
    var cfg = parseConfig({
      recipient: el.dataset.recipient,
      asset: el.dataset.asset,
      scheme: el.dataset.scheme,
      color: el.dataset.color,
      label: el.dataset.label,
      presets: el.dataset.amountPresets || el.dataset.presets,
      align: el.dataset.align,
      size: el.dataset.size,
      variant: el.dataset.variant,
      symbol: el.dataset.symbol,
      name: el.dataset.name,
      locale: el.dataset.locale,
    });
    if (!cfg.ok) {
      injectStyles();
      var note = document.createElement("span");
      note.className = "xt-note";
      note.textContent = cfg.reason;
      if (el.parentNode) el.parentNode.insertBefore(note, el.nextSibling);
      return;
    }
    mountWidget(el, cfg, el.dataset.wcProjectId || el.dataset.projectId || defaultProjectId());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
