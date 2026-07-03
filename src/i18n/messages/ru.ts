import type { Messages } from "./en";

export const ru: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "Встраиваемые кнопки чаевых Chia",

  heroKicker: "Кошелёк — кошельку · ончейн · без аккаунта",
  heroTitleLead: "Кнопка чаевых,",
  heroTitleAccent: "которой хочется хвастаться.",
  intro:
    "Настройте её слева, посмотрите, как она оживает на сцене, затем скопируйте одну строку HTML " +
    "на любой сайт. Отправители подключают кошелёк Chia и переводят ончейн — от кошелька к кошельку, без посредников.",

  recipientLabel: "Адрес получателя Chia",
  recipientHelp: "Кошелёк, который получает чаевые (начинается с xch1…).",
  recipientPlaceholder: "xch1…",
  assetLabel: "Актив",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "Другой CAT",
  catIdLabel: "id актива CAT",
  catIdHelp: "64-символьный шестнадцатеричный id актива CAT для чаевых.",
  catIdPlaceholder: "64-значный hex id актива…",
  schemeLabel: "Цветовая схема",
  schemeGreen: "Зелёная (XCH)",
  schemePurple: "Фиолетовая ($DIG)",
  schemeOrange: "Оранжевая (HOA)",
  schemeCustom: "Свой цвет",
  colorLabel: "Акцентный цвет",
  colorHelp: "Любой 6-значный шестнадцатеричный цвет (например, #7a3dff).",
  presetsLabel: "Предустановленные суммы (необязательно)",
  presetsHelp: "Суммы через запятую, например 1,5,25. Оставьте пустым для значений по умолчанию.",
  labelLabel: "Текст кнопки (необязательно)",
  labelPlaceholder: "Чаевые",

  presetXchButton: "Пресет: XCH (зелёный)",
  presetDigButton: "Пресет: $DIG (фиолетовый)",
  presetHoaButton: "Пресет: HOA (оранжевый)",

  stageCaption: "Живой предпросмотр — именно это увидят ваши посетители.",
  stageCaptionDisabled: "Введите адрес получателя, чтобы активировать живую кнопку чаевых.",
  configureEyebrow: "Настройка",
  embedEyebrow: "Встраивание",

  variantLabel: "Стиль виджета",
  variantHelp: "Как выглядит виджет чаевых там, где он встроен.",
  variantButton: "Кнопка",
  variantCompact: "Компактный",
  variantCard: "Карточка чаевых",

  symbolLabel: "Символ токена (необязательно)",
  symbolHelp: "Показывается на кнопке и суммах. Определяется автоматически из id актива; здесь можно переопределить.",
  symbolPlaceholder: "например, DIG",
  symbolDetecting: "Определение символа…",
  symbolDetected: "Определено: ",

  visitButton: "Открыть",
  copyShort: "Копировать",

  feeNote: "Комиссия сети 0,1% идёт на xchtip.app; остальное поступает напрямую получателю.",

  previewHeading: "Живой предпросмотр",
  snippetHeading: "Код для встраивания",
  snippetHelp: "Вставьте это один раз в HTML своей страницы там, где нужна кнопка.",
  copyButton: "Копировать код",
  copiedButton: "Скопировано!",
  linkHeading: "Ссылка на конструктор для отправки",
  linkHelp: "Эта ссылка заполняет конструктор заранее. Добавьте &raw=1, чтобы получить код в виде обычного текста.",
  rawLinkLabel: "URL сырого кода",

  jarLinkHeading: "Ваша страница чаевых",
  jarLinkHelp:
    "Готовая к отправке страница с вашей кнопкой — не нужен ни сайт, ни встраивание. Все настройки хранятся " +
    "в ссылке, поэтому она работает где угодно. Добавьте отображаемое имя ниже, чтобы персонализировать её.",
  jarLinkLabel: "URL страницы чаевых",
  jarNameLabel: "Отображаемое имя (необязательно)",
  jarNameHelp: "Показывается на вашей странице чаевых (например, имя или проект). Оставьте пустым для обычной страницы.",
  jarNamePlaceholder: "например, Alice или Café Zoë",
  shortLinkHeading: "Короткая ссылка",
  shortLinkHelp: "Превратите длинную ссылку на страницу чаевых в короткую ссылку xchtip.app, которой удобно делиться.",
  shortLinkButton: "Создать короткую ссылку",
  shortLinkCreating: "Создание…",
  shortLinkError: "Сейчас не удалось создать короткую ссылку. Полная ссылка на страницу чаевых выше всегда работает.",

  fixErrors: "Исправьте выделенные поля, чтобы сгенерировать код.",

  poweredBy: "Работает на Chia. Подключение кошелька через WalletConnect.",
  digNetwork: "Приложение DIG Network",

  languageLabel: "Язык",

  jarHeaderTag: "Страница чаевых Chia",
  jarEyebrow: "Отправить чаевые",
  jarHeadingNamed: "Чаевые для {name}",
  jarHeadingGeneric: "Отправить чаевые",
  jarSub: "Ончейн, от кошелька к кошельку — напрямую получателю. Оплата в",
  jarTo: "Кому",
  jarCopyAddress: "Скопировать полный адрес",
  jarAmountsLabel: "Рекомендуемые суммы",
  jarNote: "Подключите кошелёк Chia, чтобы отправить. Ничего не переводится, пока вы не подтвердите это в кошельке.",
  jarBenefit1Title: "Комиссии — копейки",
  jarBenefit1Body: "Транзакции Chia стоят доли цента — почти все ваши чаевые доходят.",
  jarBenefit2Title: "Прямо на их кошелёк",
  jarBenefit2Body: "Ни аккаунта, ни доли платформы, ни посредника, удерживающего средства.",
  jarBenefit3Title: "Вы сохраняете контроль",
  jarBenefit3Body: "Вы подписываете каждый перевод в собственном кошельке. Ничего не уходит без вашего одобрения.",
  jarFooterCta: "Создать свою страницу чаевых →",
  jarMetaTitleNamed: "Чаевые для {name} в {asset} · xchtip.app",
  jarMetaTitleGeneric: "Отправить чаевые в {asset} · xchtip.app",
  jarMetaWhoGeneric: "этому получателю",
  jarMetaDescription:
    "Отправьте {who} чаевые в {asset} на Chia — ончейн, от кошелька к кошельку, без аккаунта и без доли платформы. " +
    "Подключите кошелёк Chia, и чаевые пойдут прямо на их кошелёк.",
  jarErrorTitle: "Эта ссылка на чаевые недействительна.",
  jarErrorBody:
    "Адрес или настройки в этой ссылке неполны или повреждены, поэтому отправить чаевые некому. " +
    "Попросите новую ссылку или создайте свою.",
  jarErrorCta: "Создать страницу чаевых →",
};
