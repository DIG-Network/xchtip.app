// ShortLink — the "turn my long tip-page link into a short xchtip.app link" affordance.
//
// Given the deterministic jar URL, it calls the *.xchtip.app shortener (lib/shortener) and shows the
// resulting short link (copyable). It degrades gracefully: when the service isn't configured for this
// build it renders NOTHING (the full jar link above always works); a request failure shows a quiet,
// honest message and keeps the button actionable. Loading + error + success are all handled.

import { useCallback, useState } from "react";
import { CopyField } from "@/components/CopyField";
import { shorten, shortenerAvailable } from "@/lib/shortener";
import { S } from "@/lib/strings";

export interface ShortLinkProps {
  /** The deterministic tip-page URL to shorten. */
  target: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; shortUrl: string }
  | { status: "error" };

export function ShortLink({ target }: ShortLinkProps) {
  const [state, setState] = useState<State>({ status: "idle" });

  const onCreate = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { shortUrl } = await shorten(target);
      setState({ status: "done", shortUrl });
    } catch {
      setState({ status: "error" });
    }
  }, [target]);

  // Service not configured for this build → don't advertise a feature that can't work.
  if (!shortenerAvailable()) return null;

  return (
    <div className="output-block" data-testid="shortlink">
      <h2 className="output-heading">{S.shortLinkHeading}</h2>
      <p className="output-help">{S.shortLinkHelp}</p>

      {state.status === "done" ? (
        <CopyField value={state.shortUrl} label={S.shortLinkHeading} valueTestId="shortlink-url" />
      ) : (
        <div className="shortlink-row">
          <button
            type="button"
            className="shortlink-btn"
            onClick={onCreate}
            disabled={state.status === "loading"}
            data-testid="shortlink-create"
          >
            {state.status === "loading" ? S.shortLinkCreating : S.shortLinkButton}
          </button>
          {state.status === "error" && (
            <p className="shortlink-error" role="alert" data-testid="shortlink-error">
              {S.shortLinkError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
