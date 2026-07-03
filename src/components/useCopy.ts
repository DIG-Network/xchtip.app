// useCopy — shared copy-to-clipboard hook: writes the value, flips `copied` for a confirmation
// window, and never throws (a blocked clipboard leaves the UI actionable; the value stays
// selectable for manual copy). Used by CopyField (builder outputs) and the jar page address chip.

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCopyResult {
  /** True during the brief post-copy confirmation window. */
  copied: boolean;
  /** Write the value to the clipboard (async, non-throwing). */
  copy: () => Promise<void>;
}

export function useCopy(value: string, resetMs = 1500): UseCopyResult {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending confirmation reset on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
    } catch {
      // Clipboard blocked (e.g. no permission): stay quiet and actionable.
      setCopied(false);
    }
  }, [value, resetMs]);

  return { copied, copy };
}
