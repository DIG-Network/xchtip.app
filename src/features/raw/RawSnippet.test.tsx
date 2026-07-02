import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RawSnippet } from "./RawSnippet";
import { parseQueryParams } from "@/lib/embed";

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

describe("RawSnippet", () => {
  it("renders the snippet in a pre with data-ok=true", () => {
    const params = parseQueryParams(`?recipient=${XCH}&asset=xch&raw=1`);
    render(<RawSnippet params={params} origin="https://xchtip.test" />);
    const pre = screen.getByTestId("raw-snippet");
    expect(pre.tagName).toBe("PRE");
    expect(pre).toHaveAttribute("data-ok", "true");
    expect(pre).toHaveTextContent("<script");
  });

  it("renders an error with data-ok=false on invalid params", () => {
    const params = parseQueryParams("?recipient=bad&raw=1");
    render(<RawSnippet params={params} />);
    const pre = screen.getByTestId("raw-snippet");
    expect(pre).toHaveAttribute("data-ok", "false");
    expect(pre).toHaveTextContent("ERROR");
  });
});
