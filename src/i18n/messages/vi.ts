import type { Messages } from "./en";

export const vi: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Nút tip Chia có thể nhúng",

  heroKicker: "Miễn phí · on-chain · không cần tài khoản",
  heroTitleLead: "Một nút tip",
  heroTitleAccent: "đáng để khoe.",
  intro:
    "Cấu hình ở bên trái, xem nó sống động trên sân khấu, rồi sao chép một dòng HTML " +
    "vào bất kỳ trang web nào. Người tip kết nối ví Chia và gửi on-chain — ví tới ví, không qua trung gian.",

  recipientLabel: "Địa chỉ Chia của người nhận",
  recipientHelp: "Ví nhận tiền tip (bắt đầu bằng xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Tài sản",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetCustomCat: "CAT khác",
  catIdLabel: "id tài sản CAT",
  catIdHelp: "id tài sản thập lục phân 64 ký tự của CAT dùng để tip.",
  catIdPlaceholder: "id tài sản hex 64 ký tự…",
  schemeLabel: "Bảng màu",
  schemeGreen: "Xanh lá (XCH)",
  schemePurple: "Tím ($DIG)",
  schemeCustom: "Màu tùy chỉnh",
  colorLabel: "Màu nhấn",
  colorHelp: "Bất kỳ mã màu thập lục phân 6 chữ số nào (ví dụ #7a3dff).",
  presetsLabel: "Mức tiền có sẵn (tùy chọn)",
  presetsHelp: "Các mức tiền cách nhau bằng dấu phẩy, ví dụ 1,5,25. Để trống để dùng mặc định.",
  labelLabel: "Nhãn nút (tùy chọn)",
  labelPlaceholder: "Tip",

  presetXchButton: "Cài sẵn: XCH (xanh lá)",
  presetDigButton: "Cài sẵn: $DIG (tím)",

  stageCaption: "Xem trước trực tiếp — đây chính xác là những gì khách của bạn sẽ thấy.",
  stageCaptionDisabled: "Nhập địa chỉ người nhận để kích hoạt nút tip trực tiếp của bạn.",
  configureEyebrow: "Cấu hình",
  embedEyebrow: "Nhúng",

  variantLabel: "Kiểu widget",
  variantHelp: "Cách widget tip hiển thị ở nơi nó được nhúng.",
  variantButton: "Nút",
  variantCompact: "Gọn",
  variantCard: "Thẻ tip",

  symbolLabel: "Ký hiệu token (tùy chọn)",
  symbolHelp: "Hiển thị trên nút và số tiền. Tự động nhận diện từ id tài sản; có thể ghi đè tại đây.",
  symbolPlaceholder: "ví dụ DIG",
  symbolDetecting: "Đang nhận diện ký hiệu…",
  symbolDetected: "Đã nhận diện: ",

  visitButton: "Truy cập",
  copyShort: "Sao chép",

  feeNote: "Phí mạng 0,1% dành cho xchtip.app; phần còn lại đến thẳng người nhận.",

  previewHeading: "Xem trước trực tiếp",
  snippetHeading: "Đoạn mã nhúng",
  snippetHelp: "Dán đoạn này một lần vào HTML của trang, tại nơi bạn muốn đặt nút.",
  copyButton: "Sao chép đoạn mã",
  copiedButton: "Đã sao chép!",
  linkHeading: "Liên kết trình tạo để chia sẻ",
  linkHelp: "Liên kết này điền sẵn trình tạo. Thêm &raw=1 để lấy đoạn mã dưới dạng văn bản thuần.",
  rawLinkLabel: "URL đoạn mã thô",

  jarLinkHeading: "Trang tip của bạn",
  jarLinkHelp:
    "Một trang sẵn sàng để chia sẻ kèm nút của bạn — không cần trang web hay nhúng. Mọi thiết lập nằm trong " +
    "liên kết nên nó hoạt động ở mọi nơi. Thêm tên hiển thị bên dưới để cá nhân hóa.",
  jarLinkLabel: "URL trang tip",
  jarNameLabel: "Tên hiển thị (tùy chọn)",
  jarNameHelp: "Hiển thị trên trang tip của bạn (ví dụ tên hoặc dự án của bạn). Để trống để có trang chung.",
  jarNamePlaceholder: "ví dụ Alice, hoặc Café Zoë",
  shortLinkHeading: "Liên kết ngắn",
  shortLinkHelp: "Biến liên kết trang tip dài thành liên kết ngắn xchtip.app dễ chia sẻ.",
  shortLinkButton: "Tạo liên kết ngắn",
  shortLinkCreating: "Đang tạo…",
  shortLinkError: "Hiện không thể tạo liên kết ngắn. Liên kết trang tip đầy đủ ở trên luôn hoạt động.",

  fixErrors: "Sửa các trường được đánh dấu để tạo đoạn mã.",

  poweredBy: "Chạy trên Chia. Kết nối ví qua WalletConnect.",
  digNetwork: "Một dapp của DIG Network",

  languageLabel: "Ngôn ngữ",

  jarHeaderTag: "Một trang tip Chia",
  jarEyebrow: "Gửi tip",
  jarHeadingNamed: "Tip cho {name}",
  jarHeadingGeneric: "Gửi tip",
  jarSub: "On-chain, ví tới ví — thẳng đến người nhận. Thanh toán bằng",
  jarTo: "Đến",
  jarCopyAddress: "Sao chép địa chỉ đầy đủ",
  jarAmountsLabel: "Mức gợi ý",
  jarNote: "Kết nối ví Chia để gửi. Không có gì di chuyển cho đến khi bạn phê duyệt trong ví của mình.",
  jarBenefit1Title: "Phí chỉ vài xu",
  jarBenefit1Body: "Giao dịch Chia tốn một phần nhỏ của một xu — gần như toàn bộ tiền tip của bạn đều đến nơi.",
  jarBenefit2Title: "Thẳng vào ví của họ",
  jarBenefit2Body: "Không tài khoản, không cắt phí nền tảng, không có trung gian giữ tiền.",
  jarBenefit3Title: "Bạn luôn kiểm soát",
  jarBenefit3Body: "Bạn ký từng khoản tip trong ví của chính mình. Không gì rời đi nếu không có sự phê duyệt của bạn.",
  jarFooterCta: "Tạo trang tip của riêng bạn →",
  jarMetaTitleNamed: "Tip cho {name} bằng {asset} · xchtip.app",
  jarMetaTitleGeneric: "Gửi tip bằng {asset} · xchtip.app",
  jarMetaWhoGeneric: "người nhận này",
  jarMetaDescription:
    "Gửi cho {who} một khoản tip bằng {asset} trên Chia — on-chain, ví tới ví, không tài khoản và không cắt phí nền tảng. " +
    "Kết nối ví Chia và khoản tip đi thẳng vào ví của họ.",
  jarErrorTitle: "Liên kết tip này không hợp lệ.",
  jarErrorBody:
    "Địa chỉ hoặc thiết lập trong liên kết này chưa đầy đủ hoặc bị lỗi, nên không có ai để tip. " +
    "Hãy xin một liên kết mới, hoặc tự tạo của riêng bạn.",
  jarErrorCta: "Tạo trang tip →",
};
