import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderIntl as render } from "@/test/intl";
import { App } from "./App";
import { APP_VERSION } from "@/lib/version";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

describe("App", () => {
  it("renders the builder chrome by default", () => {
    render(<App search="" origin="https://xchtip.test" />);
    expect(screen.getByRole("banner")).toBeInTheDocument(); // header
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Skip to content")).toBeInTheDocument();
  });

  it("pre-fills the builder from query params (no raw)", () => {
    render(<App search={`?recipient=${XCH}&asset=xch`} origin="https://xchtip.test" />);
    expect(screen.getByTestId("snippet-output")).toHaveTextContent("xch-tip.js");
  });

  it("renders ONLY the raw snippet in raw mode (no chrome)", () => {
    render(<App search={`?recipient=${XCH}&asset=xch&raw=1`} origin="https://xchtip.test" />);
    expect(screen.getByTestId("raw-snippet")).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("raw mode with format=raw also works", () => {
    render(<App search={`?recipient=${XCH}&asset=xch&format=raw`} origin="https://xchtip.test" />);
    expect(screen.getByTestId("raw-snippet")).toHaveAttribute("data-ok", "true");
  });

  it("routes /jar/<recipient> to the tip-jar page (no builder)", () => {
    render(<App pathname={`/jar/${XCH}`} search="" origin="https://xchtip.test" />);
    expect(screen.getByTestId("jar-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("input-recipient")).not.toBeInTheDocument();
  });

  it("routes an invalid jar path to the jar error state", () => {
    render(<App pathname="/jar/xch1bogus" search="" origin="https://xchtip.test" />);
    expect(screen.getByTestId("jar-error")).toBeInTheDocument();
  });

  it("keeps the builder on the root path", () => {
    render(<App pathname="/" search="" origin="https://xchtip.test" />);
    expect(screen.getByTestId("input-recipient")).toBeInTheDocument();
  });

  it("shows the build's semver subtly in the footer", () => {
    render(<App search="" origin="https://xchtip.test" />);
    const version = screen.getByTestId("app-version");
    expect(version).toBeInTheDocument();
    expect(version.textContent).toBe(`v${APP_VERSION}`);
    // Non-empty, real semver — not a placeholder that failed to inject.
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("routes /embed-preview to the chromeless live-widget preview (no builder, no jar, no bug-report button)", () => {
    render(<App pathname="/embed-preview" search={`recipient=${XCH}&scheme=purple`} origin="https://xchtip.test" />);
    expect(screen.getByTestId("embed-preview-stage")).toBeInTheDocument();
    const script = screen.getByTestId("embed-preview-widget").querySelector("script")!;
    expect(script.getAttribute("data-recipient")).toBe(XCH);
    expect(script.getAttribute("data-scheme")).toBe("purple");
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bugreport-launcher")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-recipient")).not.toBeInTheDocument();
  });

  it("does NOT claim the tip itself is free (honest header — a 0.1% fee applies)", () => {
    render(<App search="" origin="https://xchtip.test" />);
    const kicker = document.querySelector(".hero-kicker");
    expect(kicker).not.toBeNull();
    expect(kicker!.textContent).not.toMatch(/\bfree\b/i);
    // The real fee disclosure is present and legible near the live preview.
    expect(document.querySelector(".stage-fee")?.textContent).toMatch(/0\.1%/);
  });
});
