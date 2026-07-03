// EmbedPreviewPage — the chromeless `/embed-preview` route the hub iframes for a LIVE preview of
// the embed widget (Developer-tab "Embeddable Tip button" panel). Renders ONLY the widget for the
// given query params (no header/footer/hero), on a transparent background, reusing the exact
// validation + mounting contract the jar page and builder already use.

import { describe, it, expect, afterEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";
import { EmbedPreviewPage } from "./EmbedPreviewPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DIG_ASSET_ID } from "@/lib/constants";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

function renderPreview(search: string) {
  return render(
    <I18nProvider initial="en">
      <EmbedPreviewPage search={search} />
    </I18nProvider>,
  );
}

afterEach(() => {
  cleanup();
  document.body.classList.remove("embed-preview-page");
});

describe("EmbedPreviewPage", () => {
  it("mounts the widget script with the requested recipient/asset/scheme/name", () => {
    renderPreview(`recipient=${XCH}&asset=${DIG_ASSET_ID}&scheme=purple&name=Alice`);
    const script = screen.getByTestId("embed-preview-widget").querySelector("script")!;
    expect(script).not.toBeNull();
    expect(script.getAttribute("src")).toBe("/embed/xch-tip.js");
    expect(script.getAttribute("data-recipient")).toBe(XCH);
    expect(script.getAttribute("data-asset")).toBe(DIG_ASSET_ID);
    expect(script.getAttribute("data-scheme")).toBe("purple");
    expect(script.getAttribute("data-name")).toBe("Alice");
    // No prominent-size override, no data-target — this is the plain embed contract, not the jar page.
    expect(script.hasAttribute("data-size")).toBe(false);
    expect(script.hasAttribute("data-target")).toBe(false);
  });

  it("defaults to xch + green when only recipient is given", () => {
    renderPreview(`recipient=${XCH}`);
    const script = screen.getByTestId("embed-preview-widget").querySelector("script")!;
    expect(script.getAttribute("data-asset")).toBe("xch");
    expect(script.getAttribute("data-scheme")).toBe("green");
  });

  it("renders NOTHING (no widget, no error) for a missing/invalid recipient — silent mid-edit state", () => {
    renderPreview("recipient=xch1bogus");
    expect(screen.getByTestId("embed-preview-stage")).toBeInTheDocument();
    expect(screen.queryByTestId("embed-preview-widget")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders no site chrome (no header/main/footer landmarks)", () => {
    renderPreview(`recipient=${XCH}`);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("sanitizes the display name the same way the jar page does (control chars stripped, length-capped)", () => {
    renderPreview(`recipient=${XCH}&name=${"x".repeat(300)}`);
    const script = screen.getByTestId("embed-preview-widget").querySelector("script")!;
    expect(script.getAttribute("data-name")).toBe("x".repeat(64));
  });

  it("threads a valid custom logo URL to the mounted widget as data-logo", () => {
    const logo = "https://example.com/logo.png";
    renderPreview(`recipient=${XCH}&logo=${encodeURIComponent(logo)}`);
    const script = screen.getByTestId("embed-preview-widget").querySelector("script")!;
    expect(script.getAttribute("data-logo")).toBe(logo);
  });

  it("drops an unsafe logo URL scheme (no data-logo emitted)", () => {
    renderPreview(`recipient=${XCH}&logo=${encodeURIComponent("javascript:alert(1)")}`);
    const script = screen.getByTestId("embed-preview-widget").querySelector("script")!;
    expect(script.hasAttribute("data-logo")).toBe(false);
  });

  it("marks the document body for transparent, chromeless styling while mounted, and unmarks on unmount", () => {
    const { unmount } = renderPreview(`recipient=${XCH}`);
    expect(document.body.classList.contains("embed-preview-page")).toBe(true);
    unmount();
    expect(document.body.classList.contains("embed-preview-page")).toBe(false);
  });
});
