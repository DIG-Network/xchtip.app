import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderIntl as render } from "@/test/intl";
import userEvent from "@testing-library/user-event";
import { BuilderForm } from "./BuilderForm";
import type { BuilderForm as Form } from "./useBuilder";

// Auto-detect uses the network client — mock it so the form tests are offline + deterministic.
vi.mock("@/lib/catSymbol", () => ({ lookupCatSymbol: vi.fn(async () => "SBX") }));

const CAT = "ab".repeat(32);

const baseForm: Form = {
  recipient: "",
  assetChoice: "xch",
  catId: "",
  scheme: "green",
  color: "#7a3dff",
  presets: "",
  label: "",
  variant: "button",
  symbol: "",
  name: "",
};

function setup(overrides: Partial<Form> = {}, errors = {}) {
  const setField = vi.fn();
  const applyXchPreset = vi.fn();
  const applyDigPreset = vi.fn();
  const applyHoaPreset = vi.fn();
  render(
    <BuilderForm
      form={{ ...baseForm, ...overrides }}
      errors={errors}
      setField={setField}
      applyXchPreset={applyXchPreset}
      applyDigPreset={applyDigPreset}
      applyHoaPreset={applyHoaPreset}
    />,
  );
  return { setField, applyXchPreset, applyDigPreset, applyHoaPreset };
}

describe("BuilderForm", () => {
  it("calls setField on recipient input", async () => {
    const user = userEvent.setup();
    const { setField } = setup();
    await user.type(screen.getByTestId("input-recipient"), "x");
    expect(setField).toHaveBeenCalledWith("recipient", "x");
  });

  it("fires the preset callbacks (XCH, $DIG, HOA)", async () => {
    const user = userEvent.setup();
    const { applyXchPreset, applyDigPreset, applyHoaPreset } = setup();
    await user.click(screen.getByTestId("preset-xch"));
    await user.click(screen.getByTestId("preset-dig"));
    await user.click(screen.getByTestId("preset-hoa"));
    expect(applyXchPreset).toHaveBeenCalled();
    expect(applyDigPreset).toHaveBeenCalled();
    expect(applyHoaPreset).toHaveBeenCalled();
  });

  it("changes the asset choice via radios", async () => {
    const user = userEvent.setup();
    const { setField } = setup();
    await user.click(screen.getByTestId("asset-dig"));
    expect(setField).toHaveBeenCalledWith("assetChoice", "dig");
    await user.click(screen.getByTestId("asset-hoa"));
    expect(setField).toHaveBeenCalledWith("assetChoice", "hoa");
  });

  it("offers the orange scheme (HOA) via a radio", async () => {
    const user = userEvent.setup();
    const { setField } = setup();
    await user.click(screen.getByTestId("scheme-orange"));
    expect(setField).toHaveBeenCalledWith("scheme", "orange");
  });

  it("shows the catId field only for the cat choice", () => {
    setup({ assetChoice: "cat" });
    expect(screen.getByTestId("input-catid")).toBeInTheDocument();
  });

  it("shows the color inputs only for the custom scheme", async () => {
    const user = userEvent.setup();
    const { setField } = setup({ scheme: "custom" });
    expect(screen.getByTestId("input-color-swatch")).toBeInTheDocument();
    await user.clear(screen.getByTestId("input-color-text"));
    // clearing triggers a setField call
    expect(setField).toHaveBeenCalled();
  });

  it("renders field errors with role=alert", () => {
    setup({}, { recipient: "bad", asset: "bad" });
    expect(screen.getByTestId("error-recipient")).toHaveTextContent("bad");
    expect(screen.getByTestId("error-asset")).toHaveTextContent("bad");
  });

  it("updates presets and label", async () => {
    const user = userEvent.setup();
    const { setField } = setup();
    await user.type(screen.getByTestId("input-presets"), "1");
    await user.type(screen.getByTestId("input-label"), "T");
    expect(setField).toHaveBeenCalledWith("presets", "1");
    expect(setField).toHaveBeenCalledWith("label", "T");
  });

  it("falls back to a safe swatch value for an invalid custom hex", () => {
    setup({ scheme: "custom", color: "notahex" });
    const swatch = screen.getByTestId("input-color-swatch") as HTMLInputElement;
    expect(swatch.value).toBe("#7a3dff");
  });

  it("changes the widget style variant via radios", async () => {
    const user = userEvent.setup();
    const { setField } = setup();
    await user.click(screen.getByTestId("variant-card"));
    expect(setField).toHaveBeenCalledWith("variant", "card");
    await user.click(screen.getByTestId("variant-compact"));
    expect(setField).toHaveBeenCalledWith("variant", "compact");
  });

  it("shows the token-symbol field for a CAT and lets the user override it", async () => {
    const user = userEvent.setup();
    const { setField } = setup({ assetChoice: "cat", catId: CAT });
    const symbolInput = screen.getByTestId("input-symbol");
    expect(symbolInput).toBeInTheDocument();
    await user.type(symbolInput, "X");
    expect(setField).toHaveBeenCalledWith("symbol", "X");
  });

  it("auto-detects + shows a suggested symbol for a valid CAT id (override blank)", async () => {
    setup({ assetChoice: "cat", catId: CAT, symbol: "" });
    await waitFor(() => expect(screen.getByTestId("symbol-status")).toHaveTextContent("SBX"));
  });

  it("hides the token-symbol field for XCH", () => {
    setup({ assetChoice: "xch" });
    expect(screen.queryByTestId("input-symbol")).not.toBeInTheDocument();
  });
});
