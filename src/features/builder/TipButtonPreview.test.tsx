import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TipButtonPreview } from "./TipButtonPreview";
import { DIG_ASSET_ID } from "@/lib/constants";

describe("TipButtonPreview", () => {
  it("renders the default XCH label for xch", () => {
    render(<TipButtonPreview scheme="green" color={null} asset={{ kind: "xch" }} label={null} />);
    expect(screen.getByTestId("tip-button-preview")).toHaveTextContent("Tip in XCH");
  });

  it("renders the DIG label for the DIG asset", () => {
    render(
      <TipButtonPreview
        scheme="purple"
        color={null}
        asset={{ kind: "cat", assetId: DIG_ASSET_ID }}
        label={null}
      />,
    );
    expect(screen.getByTestId("tip-button-preview")).toHaveTextContent("Tip in DIG");
  });

  it("renders a generic label for an unknown CAT", () => {
    render(
      <TipButtonPreview
        scheme="green"
        color={null}
        asset={{ kind: "cat", assetId: "a".repeat(64) }}
        label={null}
      />,
    );
    expect(screen.getByTestId("tip-button-preview")).toHaveTextContent("Send a tip");
  });

  it("uses a custom label when given", () => {
    render(<TipButtonPreview scheme="green" color={null} asset={{ kind: "xch" }} label="Buy me a coffee" />);
    expect(screen.getByTestId("tip-button-preview")).toHaveTextContent("Buy me a coffee");
  });

  it("applies the custom scheme accent to the background", () => {
    render(<TipButtonPreview scheme="custom" color="#7a3dff" asset={{ kind: "xch" }} label={null} />);
    const btn = screen.getByTestId("tip-button-preview");
    expect(btn.getAttribute("style")).toContain("#7a3dff");
  });
});
