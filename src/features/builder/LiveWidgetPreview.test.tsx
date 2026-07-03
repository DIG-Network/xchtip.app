// LiveWidgetPreview tests — the builder's live preview is the REAL embed widget, mounted from the
// current config. It is disabled + grayed until a valid snippet exists (no recipient yet), and
// mounts the actual /embed/xch-tip.js script (preconfigured) once the config is valid.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveWidgetPreview } from "./LiveWidgetPreview";

const SNIPPET =
  '<script src="https://xchtip.app/embed/xch-tip.js" data-recipient="xch1abc" data-asset="xch" ' +
  'data-scheme="green" data-variant="card" async></script>';

describe("LiveWidgetPreview", () => {
  it("shows a disabled, grayed placeholder when there is no valid snippet", () => {
    render(<LiveWidgetPreview snippet={null} />);
    const stage = screen.getByTestId("live-widget");
    expect(stage).toHaveAttribute("data-active", "false");
    expect(stage.getAttribute("aria-disabled")).toBe("true");
    // No widget script mounted yet.
    expect(stage.querySelector("script")).toBeNull();
  });

  it("mounts the real widget script from the snippet when active", () => {
    render(<LiveWidgetPreview snippet={SNIPPET} />);
    const stage = screen.getByTestId("live-widget");
    expect(stage).toHaveAttribute("data-active", "true");
    expect(stage.getAttribute("aria-disabled")).toBe("false");
    const script = stage.querySelector("script");
    expect(script).not.toBeNull();
    // Rewritten to the SAME-ORIGIN widget path (so the preview reflects this build).
    expect(script!.getAttribute("src")).toBe("/embed/xch-tip.js");
    expect(script!.getAttribute("data-recipient")).toBe("xch1abc");
    expect(script!.getAttribute("data-variant")).toBe("card");
    expect(script!.async).toBe(true);
  });

  it("re-mounts when the snippet changes (config edit)", () => {
    const { rerender } = render(<LiveWidgetPreview snippet={SNIPPET} />);
    const first = screen.getByTestId("live-widget").querySelector("script");
    expect(first!.getAttribute("data-scheme")).toBe("green");
    const purple = SNIPPET.replace('data-scheme="green"', 'data-scheme="purple"');
    rerender(<LiveWidgetPreview snippet={purple} />);
    const second = screen.getByTestId("live-widget").querySelector("script");
    expect(second!.getAttribute("data-scheme")).toBe("purple");
  });

  it("tears the widget down when the snippet becomes invalid again", () => {
    const { rerender } = render(<LiveWidgetPreview snippet={SNIPPET} />);
    expect(screen.getByTestId("live-widget").querySelector("script")).not.toBeNull();
    rerender(<LiveWidgetPreview snippet={null} />);
    expect(screen.getByTestId("live-widget").querySelector("script")).toBeNull();
    expect(screen.getByTestId("live-widget")).toHaveAttribute("data-active", "false");
  });
});
