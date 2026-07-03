import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuilderPanel } from "./BuilderPanel";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";
const ORIGIN = "https://xchtip.test";

describe("BuilderPanel", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  it("blocks the snippet until a valid recipient is entered", async () => {
    const user = userEvent.setup();
    render(<BuilderPanel origin={ORIGIN} />);
    expect(screen.getByTestId("snippet-blocked")).toBeInTheDocument();

    await user.type(screen.getByTestId("input-recipient"), XCH);
    expect(screen.getByTestId("snippet-output")).toHaveTextContent("xch-tip.js");
    expect(screen.queryByTestId("snippet-blocked")).not.toBeInTheDocument();
  });

  it("shows a recipient error for a bad address", async () => {
    const user = userEvent.setup();
    render(<BuilderPanel origin={ORIGIN} />);
    await user.type(screen.getByTestId("input-recipient"), "not-valid");
    expect(screen.getByTestId("error-recipient")).toBeInTheDocument();
  });

  it("the $DIG preset fills the DIG asset + purple and updates the snippet", async () => {
    const user = userEvent.setup();
    render(<BuilderPanel origin={ORIGIN} />);
    await user.type(screen.getByTestId("input-recipient"), XCH);
    await user.click(screen.getByTestId("preset-dig"));
    expect(screen.getByTestId("snippet-output")).toHaveTextContent("data-scheme=\"purple\"");
    // DIG asset id present.
    expect(screen.getByTestId("snippet-output").textContent).toContain(
      "a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81",
    );
  });

  it("reveals the CAT id field when the Other CAT asset is chosen", async () => {
    const user = userEvent.setup();
    render(<BuilderPanel origin={ORIGIN} />);
    await user.click(screen.getByTestId("asset-cat"));
    expect(screen.getByTestId("input-catid")).toBeInTheDocument();
  });

  it("reveals the color picker when the custom scheme is chosen", async () => {
    const user = userEvent.setup();
    render(<BuilderPanel origin={ORIGIN} />);
    await user.click(screen.getByTestId("scheme-custom"));
    expect(screen.getByTestId("input-color-text")).toBeInTheDocument();
  });

  it("shows the shareable builder + raw links when valid", async () => {
    const user = userEvent.setup();
    render(<BuilderPanel origin={ORIGIN} />);
    await user.type(screen.getByTestId("input-recipient"), XCH);
    expect(screen.getByTestId("builder-link")).toHaveTextContent(`${ORIGIN}/?`);
    expect(screen.getByTestId("raw-link")).toHaveTextContent("raw=1");
  });

  it("pre-fills from an initial form", () => {
    render(
      <BuilderPanel
        origin={ORIGIN}
        initialForm={{
          recipient: XCH,
          assetChoice: "dig",
          catId: "",
          scheme: "purple",
          color: "#7a3dff",
          presets: "",
          label: "",
          variant: "button",
          symbol: "",
          name: "",
        }}
      />,
    );
    expect(screen.getByTestId("snippet-output")).toHaveTextContent("data-scheme=\"purple\"");
  });
});
