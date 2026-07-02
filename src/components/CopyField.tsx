// CopyField — a shared presentational primitive: a labelled, read-only value in a <code>/<pre> with
// a copy button that writes to the clipboard and briefly confirms. Handles the async clipboard call
// (success → "Copied!" for 1.5s; failure → the button stays actionable). Accessible: the copy state
// change is announced via aria-live, the region is labelled, and the value is selectable text.

import { useCallback, useRef, useState } from "react";
import { S } from "@/lib/strings";

export interface CopyFieldProps {
  /** The text to display + copy. */
  value: string;
  /** An accessible label for the field (also the visible heading id target). */
  label: string;
  /** Render the value in a multi-line <pre> (snippet) vs a single-line <code> (link). */
  multiline?: boolean;
  /** A stable test id for the value element. */
  valueTestId?: string;
}

export function CopyField({ value, label, multiline = false, valueTestId }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. no permission): leave the button actionable; the value is
      // selectable so the user can copy manually. No throw — never break the UI on a copy failure.
      setCopied(false);
    }
  }, [value]);

  return (
    <div className="copy-field">
      <div className="copy-field-row">
        <span className="copy-field-label" aria-hidden="true">
          {label}
        </span>
        <button
          type="button"
          className="copy-btn"
          onClick={onCopy}
          aria-label={`${S.copyButton}: ${label}`}
        >
          {copied ? S.copiedButton : S.copyButton}
        </button>
      </div>
      {multiline ? (
        <pre className="copy-value copy-value-pre" data-testid={valueTestId} tabIndex={0} aria-label={label}>
          <code>{value}</code>
        </pre>
      ) : (
        <code className="copy-value copy-value-inline" data-testid={valueTestId} tabIndex={0} aria-label={label}>
          {value}
        </code>
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
