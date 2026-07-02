// RawSnippet — the machine-readable raw mode. When the page is loaded with `?…&raw=1` (or
// `format=raw`), the SPA renders ONLY the embed snippet as plain text inside a <pre> with a stable
// data-testid, and NOTHING else (no chrome). A tool/agent can GET the URL and read the snippet
// directly without scraping UI. On invalid params it renders a plain-text error (still scrape-free).
//
// NOTE: this is the SPA's raw rendering. A true text/plain response for `/embed.txt` is also served
// at the edge (a CloudFront function) — see terraform + llms.txt. Both paths yield the same snippet.

import type { QueryParams } from "@/lib/embed";
import { rawOutput } from "./rawOutput";

export interface RawSnippetProps {
  params: QueryParams;
  origin?: string;
}

export function RawSnippet({ params, origin }: RawSnippetProps) {
  const { ok, text } = rawOutput(params, origin);
  return (
    <pre
      className="raw-snippet"
      data-testid="raw-snippet"
      data-ok={ok ? "true" : "false"}
      style={{
        margin: 0,
        padding: "1rem",
        fontFamily: "ui-monospace, monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      {text}
    </pre>
  );
}
