// ShortLink tests — the "make a short *.xchtip.app link" affordance. Covers all four states: hidden
// when the service is unconfigured, the idle button, a successful shorten (→ copyable URL), and a
// graceful failure (honest message, button stays actionable). The shortener module is mocked so the
// flow is tested with no network.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortLink } from "./ShortLink";
import * as shortener from "@/lib/shortener";

vi.mock("@/lib/shortener", () => ({
  shortenerAvailable: vi.fn(),
  shorten: vi.fn(),
}));

const mockAvailable = vi.mocked(shortener.shortenerAvailable);
const mockShorten = vi.mocked(shortener.shorten);
const TARGET = "https://xchtip.app/jar/xch1abc?asset=xch";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ShortLink", () => {
  it("renders nothing when the shortener is not configured", () => {
    mockAvailable.mockReturnValue(false);
    const { container } = render(<ShortLink target={TARGET} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an idle create button when configured", () => {
    mockAvailable.mockReturnValue(true);
    render(<ShortLink target={TARGET} />);
    expect(screen.getByTestId("shortlink")).toBeInTheDocument();
    expect(screen.getByTestId("shortlink-create")).toBeEnabled();
  });

  it("creates and shows a copyable short link on success", async () => {
    const user = userEvent.setup();
    mockAvailable.mockReturnValue(true);
    mockShorten.mockResolvedValue({ code: "abc", shortUrl: "https://abc.xchtip.app" });
    render(<ShortLink target={TARGET} />);
    await user.click(screen.getByTestId("shortlink-create"));
    await waitFor(() => expect(screen.getByTestId("shortlink-url")).toBeInTheDocument());
    expect(screen.getByTestId("shortlink-url").textContent).toContain("abc.xchtip.app");
    expect(mockShorten).toHaveBeenCalledWith(TARGET);
  });

  it("shows an honest error and keeps the button actionable on failure", async () => {
    const user = userEvent.setup();
    mockAvailable.mockReturnValue(true);
    mockShorten.mockRejectedValue(new Error("nope"));
    render(<ShortLink target={TARGET} />);
    await user.click(screen.getByTestId("shortlink-create"));
    await waitFor(() => expect(screen.getByTestId("shortlink-error")).toBeInTheDocument());
    expect(screen.getByTestId("shortlink-create")).toBeEnabled();
  });
});
