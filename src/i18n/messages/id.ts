import type { Messages } from "./en";

export const id: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Tombol tip Chia yang bisa disematkan",

  heroKicker: "Dompet ke dompet · on-chain · tanpa akun",
  heroTitleLead: "Tombol tip",
  heroTitleAccent: "yang layak dipamerkan.",
  intro:
    "Atur di sebelah kiri, lihat ia hidup di panggung, lalu salin satu baris HTML " +
    "ke situs mana pun. Pemberi tip menghubungkan dompet Chia dan mengirim on-chain — dompet ke dompet, tanpa perantara.",

  recipientLabel: "Alamat Chia penerima",
  recipientHelp: "Dompet yang menerima tip (diawali xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Aset",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "CAT lain",
  catIdLabel: "id aset CAT",
  catIdHelp: "id aset heksadesimal 64 karakter dari CAT yang dipakai untuk tip.",
  catIdPlaceholder: "id aset hex 64 karakter…",
  schemeLabel: "Skema warna",
  schemeGreen: "Hijau (XCH)",
  schemePurple: "Ungu ($DIG)",
  schemeOrange: "Oranye (HOA)",
  schemeCustom: "Warna khusus",
  colorLabel: "Warna aksen",
  colorHelp: "Warna heksadesimal 6 digit apa pun (mis. #7a3dff).",
  presetsLabel: "Nominal preset (opsional)",
  presetsHelp: "Nominal dipisah koma, mis. 1,5,25. Kosongkan untuk nilai bawaan.",
  labelLabel: "Teks tombol (opsional)",
  labelPlaceholder: "Tip",

  presetXchButton: "Preset: XCH (hijau)",
  presetDigButton: "Preset: $DIG (ungu)",
  presetHoaButton: "Preset: HOA (oranye)",

  stageCaption: "Pratinjau langsung — inilah persis yang akan dilihat pengunjung Anda.",
  stageCaptionDisabled: "Masukkan alamat penerima untuk mengaktifkan tombol tip langsung Anda.",
  configureEyebrow: "Atur",
  embedEyebrow: "Sematkan",

  variantLabel: "Gaya widget",
  variantHelp: "Tampilan widget tip di tempat ia disematkan.",
  variantButton: "Tombol",
  variantCompact: "Ringkas",
  variantCard: "Kartu tip",

  symbolLabel: "Simbol token (opsional)",
  symbolHelp: "Ditampilkan pada tombol dan nominal. Terdeteksi otomatis dari id aset; timpa di sini.",
  symbolPlaceholder: "mis. DIG",
  symbolDetecting: "Mendeteksi simbol…",
  symbolDetected: "Terdeteksi: ",

  visitButton: "Kunjungi",
  copyShort: "Salin",

  feeNote: "Biaya 0,1% mendukung xchtip.app, ditambah sedikit biaya jaringan XCH — sisanya langsung ke penerima.",

  previewHeading: "Pratinjau langsung",
  snippetHeading: "Cuplikan sematan",
  snippetHelp: "Tempel ini sekali ke HTML halaman Anda, di tempat Anda ingin tombolnya.",
  copyButton: "Salin cuplikan",
  copiedButton: "Tersalin!",
  linkHeading: "Tautan builder untuk dibagikan",
  linkHelp: "Tautan ini mengisi builder terlebih dahulu. Tambahkan &raw=1 untuk mendapat cuplikan sebagai teks biasa.",
  rawLinkLabel: "URL cuplikan mentah",

  jarLinkHeading: "Halaman tip Anda",
  jarLinkHelp:
    "Halaman siap bagikan berisi tombol Anda — tanpa situs atau penyematan. Semua pengaturan tersimpan di " +
    "tautan, jadi berfungsi di mana saja. Tambahkan nama tampilan di bawah untuk mempersonalisasinya.",
  jarLinkLabel: "URL halaman tip",
  jarNameLabel: "Nama tampilan (opsional)",
  jarNameHelp: "Ditampilkan di halaman tip Anda (mis. nama atau proyek Anda). Kosongkan untuk halaman umum.",
  jarNamePlaceholder: "mis. Alice, atau Café Zoë",
  shortLinkHeading: "Tautan pendek",
  shortLinkHelp: "Ubah tautan halaman tip yang panjang menjadi tautan pendek xchtip.app yang mudah dibagikan.",
  shortLinkButton: "Buat tautan pendek",
  shortLinkCreating: "Membuat…",
  shortLinkError: "Tautan pendek tidak bisa dibuat saat ini. Tautan halaman tip lengkap di atas selalu berfungsi.",

  fixErrors: "Perbaiki kolom yang disorot untuk membuat cuplikan.",

  poweredBy: "Berjalan di Chia. Koneksi dompet melalui WalletConnect.",
  digNetwork: "Sebuah dapp DIG Network",

  languageLabel: "Bahasa",

  jarHeaderTag: "Halaman tip Chia",
  jarEyebrow: "Kirim tip",
  jarHeadingNamed: "Beri tip {name}",
  jarHeadingGeneric: "Kirim tip",
  jarSub: "On-chain, dompet ke dompet — langsung ke penerima. Dibayar dalam",
  jarTo: "Kepada",
  jarCopyAddress: "Salin alamat lengkap",
  jarAmountsLabel: "Nominal yang disarankan",
  jarNote: "Hubungkan dompet Chia untuk mengirim. Tidak ada yang berpindah sampai Anda menyetujuinya di dompet Anda.",
  jarBenefit1Title: "Biayanya recehan",
  jarBenefit1Body: "Transaksi Chia hanya sepersekian sen — hampir seluruh tip Anda sampai.",
  jarBenefit2Title: "Langsung ke dompet mereka",
  jarBenefit2Body: "Tanpa akun, tanpa potongan platform, tanpa perantara yang menahan dana.",
  jarBenefit3Title: "Anda tetap memegang kendali",
  jarBenefit3Body: "Anda menandatangani setiap tip di dompet Anda sendiri. Tidak ada yang keluar tanpa persetujuan Anda.",
  jarFooterCta: "Buat halaman tip Anda sendiri →",
  jarMetaTitleNamed: "Beri tip {name} dalam {asset} · xchtip.app",
  jarMetaTitleGeneric: "Kirim tip dalam {asset} · xchtip.app",
  jarMetaWhoGeneric: "penerima ini",
  jarMetaDescription:
    "Kirim {who} sebuah tip dalam {asset} di Chia — on-chain, dompet ke dompet, tanpa akun dan tanpa potongan platform. " +
    "Hubungkan dompet Chia dan tip langsung masuk ke dompet mereka.",
  jarErrorTitle: "Tautan tip ini tidak valid.",
  jarErrorBody:
    "Alamat atau pengaturan di tautan ini tidak lengkap atau salah format, jadi tidak ada yang bisa diberi tip. " +
    "Mintalah tautan baru, atau buat milik Anda sendiri.",
  jarErrorCta: "Buat halaman tip →",
};
