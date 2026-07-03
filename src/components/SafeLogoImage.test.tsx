// SafeLogoImage — renders a user-supplied logo URL SAFELY: only as a real <img src> with the
// hardening attributes (no-referrer, lazy, async-decode, fixed dimensions), never inline
// HTML/SVG/background. Falls back to `fallback` on a load error so a broken URL never leaves a
// broken image. See lib/logo.ts for the URL scheme validation (this component trusts its `src` was
// already validated by the caller — it does not re-validate).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SafeLogoImage } from "./SafeLogoImage";

describe("SafeLogoImage", () => {
  it("renders a real <img> (not inline markup) with the hardening attributes", () => {
    render(<SafeLogoImage src="https://example.com/logo.png" alt="DIG" />);
    const img = screen.getByRole("img", { name: "DIG" });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    expect(img).toHaveAttribute("alt", "DIG");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    // Fixed dimensions — no layout shift while loading.
    expect(img).toHaveAttribute("width");
    expect(img).toHaveAttribute("height");
  });

  it("falls back to the given fallback node when the image fails to load", () => {
    render(<SafeLogoImage src="https://example.com/broken.png" alt="CAT" fallback={<span data-testid="fallback">C</span>} />);
    const img = screen.getByRole("img", { name: "CAT" });
    fireEvent.error(img);
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "CAT" })).not.toBeInTheDocument();
  });

  it("renders nothing when it fails and no fallback is given", () => {
    const { container } = render(<SafeLogoImage src="https://example.com/broken.png" alt="CAT" />);
    fireEvent.error(screen.getByRole("img", { name: "CAT" }));
    expect(container).toBeEmptyDOMElement();
  });

  it("calls the optional onError callback", () => {
    const onError = vi.fn();
    render(<SafeLogoImage src="https://example.com/broken.png" alt="CAT" onError={onError} />);
    fireEvent.error(screen.getByRole("img", { name: "CAT" }));
    expect(onError).toHaveBeenCalledOnce();
  });
});
