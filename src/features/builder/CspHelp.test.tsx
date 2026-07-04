// CspHelp tests — the embedder CSP disclosure. Covers: it renders collapsed with the heading, the
// copyable directive block contains all four directives, the per-directive explanations render,
// the merge note is present, and the copy button actually calls the clipboard with the exact block
// (byte-identical to the single source of truth in lib/embedCsp.ts).

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderIntl as render } from "@/test/intl";
import userEvent from "@testing-library/user-event";
import { CspHelp } from "./CspHelp";
import { EMBED_CSP } from "@/lib/embedCsp";

// Install a clipboard spy AFTER userEvent.setup() (which installs its own clipboard stub) so our
// spy is the one the component calls — mirrors src/components/CopyField.test.tsx.
function installClipboardSpy(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

describe("CspHelp", () => {
  it("renders a collapsed disclosure titled Content-Security-Policy", () => {
    render(<CspHelp />);
    const details = screen.getByTestId("csp-help");
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute("open");
    expect(details.querySelector("summary")).toHaveTextContent("Content-Security-Policy");
  });

  it("shows the exact copyable CSP block with all four directives", () => {
    render(<CspHelp />);
    const value = screen.getByTestId("csp-snippet");
    expect(value.textContent).toBe(EMBED_CSP);
    expect(value.textContent).toContain("script-src");
    expect(value.textContent).toContain("style-src");
    expect(value.textContent).toContain("connect-src");
    expect(value.textContent).toContain("frame-src");
  });

  it("explains each directive in plain terms and includes the merge note", () => {
    render(<CspHelp />);
    expect(screen.getByText(/loads the widget's own script/)).toBeInTheDocument();
    expect(screen.getByText(/injects its own button/)).toBeInTheDocument();
    expect(screen.getByText(/reads and broadcasts on the Chia chain/)).toBeInTheDocument();
    expect(screen.getByText(/anti-phishing check/)).toBeInTheDocument();
    expect(screen.getByText(/ADD to your site's existing policy/)).toBeInTheDocument();
  });

  it("copies the exact CSP block to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    installClipboardSpy(writeText);
    render(<CspHelp />);
    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith(EMBED_CSP);
  });
});
