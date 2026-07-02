import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

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
});
