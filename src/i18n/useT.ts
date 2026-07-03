// useT — a tiny typed wrapper over react-intl's formatMessage keyed by our MessageKey union, so a
// component writes `t("recipientLabel")` (autocompleted, typo-proof) instead of a raw string id.
// Supports ICU values: `t("jarHeadingNamed", { name })`. The id doubles as the English defaultMessage
// so a missing catalog entry still renders sensible English.

import { useIntl } from "react-intl";
import { en, type MessageKey } from "./messages/en";

export type TFunction = (key: MessageKey, values?: Record<string, string | number>) => string;

export function useT(): TFunction {
  const intl = useIntl();
  return (key, values) =>
    intl.formatMessage({ id: key, defaultMessage: en[key] }, values);
}
