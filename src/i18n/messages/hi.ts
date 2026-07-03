import type { Messages } from "./en";

export const hi: Partial<Messages> = {
  appName: "xchtip.app",
  headerTag: "एम्बेड करने योग्य Chia टिप बटन",

  heroKicker: "मुफ़्त · ऑन-चेन · कोई खाता नहीं",
  heroTitleLead: "एक टिप बटन",
  heroTitleAccent: "जिसे दिखाने में गर्व हो।",
  intro:
    "बाईं ओर इसे कॉन्फ़िगर करें, स्टेज पर इसे जीवंत होते देखें, फिर HTML की एक पंक्ति " +
    "किसी भी साइट पर कॉपी करें। टिप देने वाले एक Chia वॉलेट कनेक्ट करते हैं और ऑन-चेन भेजते हैं — वॉलेट से वॉलेट, बिना किसी बिचौलिए के।",

  recipientLabel: "प्राप्तकर्ता का Chia पता",
  recipientHelp: "वह वॉलेट जो टिप प्राप्त करता है (xch1… से शुरू होता है)।",
  recipientPlaceholder: "xch1…",
  assetLabel: "एसेट",
  assetXch: "XCH",
  assetDig: "$DIG",
  assetHoa: "HOA",
  assetCustomCat: "अन्य CAT",
  catIdLabel: "CAT एसेट id",
  catIdHelp: "जिस CAT में टिप देना है उसका 64-अक्षर वाला हेक्स एसेट id।",
  catIdPlaceholder: "64-हेक्स एसेट id…",
  schemeLabel: "रंग योजना",
  schemeGreen: "हरा (XCH)",
  schemePurple: "बैंगनी ($DIG)",
  schemeOrange: "नारंगी (HOA)",
  schemeCustom: "कस्टम रंग",
  colorLabel: "एक्सेंट रंग",
  colorHelp: "कोई भी 6-अंकों वाला हेक्स रंग (जैसे #7a3dff)।",
  presetsLabel: "राशि प्रीसेट (वैकल्पिक)",
  presetsHelp: "अल्पविराम से अलग की गई राशियाँ, जैसे 1,5,25। डिफ़ॉल्ट के लिए खाली छोड़ें।",
  labelLabel: "बटन लेबल (वैकल्पिक)",
  labelPlaceholder: "टिप",

  presetXchButton: "प्रीसेट: XCH (हरा)",
  presetDigButton: "प्रीसेट: $DIG (बैंगनी)",
  presetHoaButton: "प्रीसेट: HOA (नारंगी)",

  stageCaption: "लाइव पूर्वावलोकन — आपके आगंतुक ठीक यही देखेंगे।",
  stageCaptionDisabled: "अपना लाइव टिप बटन सक्रिय करने के लिए प्राप्तकर्ता का पता दर्ज करें।",
  configureEyebrow: "कॉन्फ़िगर करें",
  embedEyebrow: "एम्बेड करें",

  variantLabel: "विजेट शैली",
  variantHelp: "जहाँ इसे एम्बेड किया गया है वहाँ टिप विजेट कैसा दिखता है।",
  variantButton: "बटन",
  variantCompact: "संक्षिप्त",
  variantCard: "टिप कार्ड",

  symbolLabel: "टोकन प्रतीक (वैकल्पिक)",
  symbolHelp: "बटन और राशियों पर दिखाया जाता है। एसेट id से अपने-आप पहचाना जाता है; यहाँ बदल सकते हैं।",
  symbolPlaceholder: "जैसे DIG",
  symbolDetecting: "प्रतीक पहचाना जा रहा है…",
  symbolDetected: "पहचाना गया: ",

  visitButton: "जाएँ",
  copyShort: "कॉपी करें",

  feeNote: "0.1% नेटवर्क शुल्क xchtip.app को जाता है; बाकी सीधे प्राप्तकर्ता को जाता है।",

  previewHeading: "लाइव पूर्वावलोकन",
  snippetHeading: "एम्बेड स्निपेट",
  snippetHelp: "इसे अपने पेज के HTML में एक बार वहाँ पेस्ट करें जहाँ आप बटन चाहते हैं।",
  copyButton: "स्निपेट कॉपी करें",
  copiedButton: "कॉपी हो गया!",
  linkHeading: "साझा करने योग्य बिल्डर लिंक",
  linkHelp: "यह लिंक बिल्डर को पहले से भर देता है। स्निपेट को सादे टेक्स्ट के रूप में पाने के लिए &raw=1 जोड़ें।",
  rawLinkLabel: "रॉ स्निपेट URL",

  jarLinkHeading: "आपका टिप पेज",
  jarLinkHelp:
    "आपके बटन के साथ साझा करने के लिए तैयार एक पेज — किसी साइट या एम्बेडिंग की ज़रूरत नहीं। सभी सेटिंग्स " +
    "लिंक में मौजूद रहती हैं, इसलिए यह कहीं भी काम करता है। इसे वैयक्तिकृत करने के लिए नीचे एक प्रदर्शन नाम जोड़ें।",
  jarLinkLabel: "टिप पेज URL",
  jarNameLabel: "प्रदर्शन नाम (वैकल्पिक)",
  jarNameHelp: "आपके टिप पेज पर दिखाया जाता है (जैसे आपका नाम या प्रोजेक्ट)। सामान्य पेज के लिए खाली छोड़ें।",
  jarNamePlaceholder: "जैसे Alice, या Café Zoë",
  shortLinkHeading: "छोटा लिंक",
  shortLinkHelp: "लंबे टिप-पेज लिंक को एक छोटे xchtip.app लिंक में बदलें जिसे साझा करना आसान हो।",
  shortLinkButton: "छोटा लिंक बनाएँ",
  shortLinkCreating: "बनाया जा रहा है…",
  shortLinkError: "अभी छोटा लिंक नहीं बन सका। ऊपर दिया आपका पूरा टिप-पेज लिंक हमेशा काम करता है।",

  fixErrors: "स्निपेट बनाने के लिए हाइलाइट किए गए फ़ील्ड ठीक करें।",

  poweredBy: "Chia पर चलता है। वॉलेट कनेक्शन WalletConnect के ज़रिए।",
  digNetwork: "एक DIG Network dapp",

  languageLabel: "भाषा",

  jarHeaderTag: "एक Chia टिप पेज",
  jarEyebrow: "टिप भेजें",
  jarHeadingNamed: "{name} को टिप दें",
  jarHeadingGeneric: "टिप भेजें",
  jarSub: "ऑन-चेन, वॉलेट से वॉलेट — सीधे प्राप्तकर्ता को। भुगतान इसमें:",
  jarTo: "किसे",
  jarCopyAddress: "पूरा पता कॉपी करें",
  jarAmountsLabel: "सुझाई गई राशियाँ",
  jarNote: "भेजने के लिए एक Chia वॉलेट कनेक्ट करें। जब तक आप अपने वॉलेट में मंज़ूरी नहीं देते, कुछ भी नहीं चलता।",
  jarBenefit1Title: "शुल्क बस पैसे भर",
  jarBenefit1Body: "Chia लेनदेन की लागत एक सेंट का छोटा-सा अंश है — आपकी लगभग पूरी टिप पहुँच जाती है।",
  jarBenefit2Title: "सीधे उनके वॉलेट में",
  jarBenefit2Body: "कोई खाता नहीं, कोई प्लेटफ़ॉर्म कटौती नहीं, फंड रोकने वाला कोई बिचौलिया नहीं।",
  jarBenefit3Title: "नियंत्रण आपके पास रहता है",
  jarBenefit3Body: "आप हर टिप को अपने ही वॉलेट में साइन करते हैं। आपकी मंज़ूरी के बिना कुछ भी बाहर नहीं जाता।",
  jarFooterCta: "अपना खुद का टिप पेज बनाएँ →",
  jarMetaTitleNamed: "{name} को {asset} में टिप दें · xchtip.app",
  jarMetaTitleGeneric: "{asset} में टिप भेजें · xchtip.app",
  jarMetaWhoGeneric: "इस प्राप्तकर्ता",
  jarMetaDescription:
    "{who} को Chia पर {asset} में टिप भेजें — ऑन-चेन, वॉलेट से वॉलेट, बिना खाते और बिना प्लेटफ़ॉर्म कटौती के। " +
    "एक Chia वॉलेट कनेक्ट करें और टिप सीधे उनके वॉलेट में चली जाती है।",
  jarErrorTitle: "यह टिप लिंक मान्य नहीं है।",
  jarErrorBody:
    "इस लिंक में पता या सेटिंग्स अधूरी या ग़लत हैं, इसलिए टिप देने के लिए कुछ नहीं है। " +
    "एक नया लिंक माँगें, या अपना खुद का बनाएँ।",
  jarErrorCta: "एक टिप पेज बनाएँ →",
};
