import type { Messages } from "./en";

export const ko: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "삽입 가능한 Chia 팁 버튼",

  heroKicker: "지갑 대 지갑 · 온체인 · 계정 불필요",
  heroTitleLead: "팁 버튼",
  heroTitleAccent: "자랑할 만한.",
  intro:
    "왼쪽에서 설정하고 무대에서 실시간으로 확인한 다음, HTML 한 줄을 " +
    "어떤 사이트에든 붙여넣으세요. 후원자는 Chia 지갑을 연결해 온체인으로 보냅니다 — 지갑 대 지갑, 중개자 없이.",

  recipientLabel: "받는 Chia 주소",
  recipientHelp: "팁을 받을 지갑입니다 (xch1…로 시작).",
  recipientPlaceholder: "xch1…",
  assetLabel: "자산",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "기타 CAT",
  catIdLabel: "CAT 자산 id",
  catIdHelp: "팁으로 보낼 CAT의 64자리 16진수 자산 id입니다.",
  catIdPlaceholder: "64자리 16진수 자산 id…",
  schemeLabel: "색상 구성",
  schemeGreen: "초록 (XCH)",
  schemePurple: "보라 ($DIG)",
  schemeOrange: "주황 (HOA)",
  schemeCustom: "사용자 지정 색상",
  colorLabel: "강조 색상",
  colorHelp: "임의의 6자리 16진수 색상 (예: #7a3dff).",
  presetsLabel: "금액 프리셋 (선택)",
  presetsHelp: "쉼표로 구분한 금액, 예: 1,5,25. 비워 두면 기본값을 사용합니다.",
  labelLabel: "버튼 문구 (선택)",
  labelPlaceholder: "팁",

  presetXchButton: "프리셋: XCH (초록)",
  presetDigButton: "프리셋: $DIG (보라)",
  presetHoaButton: "프리셋: HOA (주황)",

  stageCaption: "실시간 미리보기 — 방문자에게 보이는 그대로입니다.",
  stageCaptionDisabled: "받는 주소를 입력하면 실시간 팁 버튼이 활성화됩니다.",
  configureEyebrow: "설정",
  embedEyebrow: "삽입",

  variantLabel: "위젯 스타일",
  variantHelp: "삽입된 위치에서 팁 위젯이 보이는 방식입니다.",
  variantButton: "버튼",
  variantCompact: "간결",
  variantCard: "팁 카드",

  symbolLabel: "토큰 심볼 (선택)",
  symbolHelp: "버튼과 금액에 표시됩니다. 자산 id에서 자동 감지되며, 여기서 재정의할 수 있습니다.",
  symbolPlaceholder: "예: DIG",
  symbolDetecting: "심볼 감지 중…",
  symbolDetected: "감지됨: ",

  visitButton: "방문",
  copyShort: "복사",

  feeNote: "0.1%의 네트워크 수수료는 xchtip.app로 가고, 나머지는 모두 받는 사람에게 바로 전달됩니다.",

  previewHeading: "실시간 미리보기",
  snippetHeading: "삽입 코드",
  snippetHelp: "버튼을 넣고 싶은 위치에 이 코드를 페이지 HTML에 한 번만 붙여넣으세요.",
  copyButton: "코드 복사",
  copiedButton: "복사됨!",
  linkHeading: "공유 가능한 빌더 링크",
  linkHelp: "이 링크는 빌더를 미리 채워 줍니다. &raw=1 을 추가하면 코드를 일반 텍스트로 받습니다.",
  rawLinkLabel: "원시 코드 URL",

  jarLinkHeading: "내 팁 페이지",
  jarLinkHelp:
    "버튼이 포함된, 바로 공유할 수 있는 페이지입니다 — 사이트나 삽입이 필요 없습니다. 모든 설정이 " +
    "링크에 담겨 있어 어디서나 작동합니다. 아래에 표시 이름을 추가해 개인화하세요.",
  jarLinkLabel: "팁 페이지 URL",
  jarNameLabel: "표시 이름 (선택)",
  jarNameHelp: "팁 페이지에 표시됩니다 (예: 이름이나 프로젝트). 비워 두면 일반 페이지가 됩니다.",
  jarNamePlaceholder: "예: Alice, 또는 Café Zoë",
  shortLinkHeading: "짧은 링크",
  shortLinkHelp: "긴 팁 페이지 링크를 공유하기 쉬운 xchtip.app 짧은 링크로 바꿉니다.",
  shortLinkButton: "짧은 링크 만들기",
  shortLinkCreating: "만드는 중…",
  shortLinkError: "지금은 짧은 링크를 만들 수 없습니다. 위의 전체 팁 페이지 링크는 항상 작동합니다.",

  fixErrors: "강조 표시된 항목을 수정하면 코드가 생성됩니다.",

  poweredBy: "Chia에서 실행됩니다. 지갑 연결은 WalletConnect를 통해 이루어집니다.",
  digNetwork: "DIG Network dapp",

  languageLabel: "언어",

  jarHeaderTag: "Chia 팁 페이지",
  jarEyebrow: "팁 보내기",
  jarHeadingNamed: "{name}에게 팁",
  jarHeadingGeneric: "팁 보내기",
  jarSub: "온체인, 지갑 대 지갑 — 받는 사람에게 바로. 지불 통화:",
  jarTo: "받는 사람",
  jarCopyAddress: "전체 주소 복사",
  jarAmountsLabel: "추천 금액",
  jarNote: "보내려면 Chia 지갑을 연결하세요. 지갑에서 승인하기 전에는 아무것도 이동하지 않습니다.",
  jarBenefit1Title: "수수료는 몇 원 수준",
  jarBenefit1Body: "Chia 거래 비용은 1센트도 되지 않아 팁이 거의 전액 도착합니다.",
  jarBenefit2Title: "지갑으로 바로",
  jarBenefit2Body: "계정도, 플랫폼 수수료도, 자금을 쥐고 있는 중개자도 없습니다.",
  jarBenefit3Title: "언제나 당신이 통제",
  jarBenefit3Body: "모든 팁을 당신의 지갑에서 직접 서명합니다. 승인 없이는 아무것도 나가지 않습니다.",
  jarFooterCta: "나만의 팁 페이지 만들기 →",
  jarMetaTitleNamed: "{asset}로 {name}에게 팁 · xchtip.app",
  jarMetaTitleGeneric: "{asset} 팁 보내기 · xchtip.app",
  jarMetaWhoGeneric: "이 받는 사람",
  jarMetaDescription:
    "Chia에서 {asset}로 {who}에게 팁을 보내세요 — 온체인, 지갑 대 지갑, 계정 없이 플랫폼 수수료 없이. " +
    "Chia 지갑을 연결하면 팁이 상대방 지갑으로 바로 갑니다.",
  jarErrorTitle: "이 팁 링크는 유효하지 않습니다.",
  jarErrorBody:
    "이 링크의 주소나 설정이 불완전하거나 형식이 잘못되어 팁을 보낼 대상이 없습니다. " +
    "새 링크를 요청하거나 직접 만들어 보세요.",
  jarErrorCta: "팁 페이지 만들기 →",
};
