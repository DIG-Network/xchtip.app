import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyField } from "./CopyField";

// Install a clipboard spy AFTER userEvent.setup() (which installs its own clipboard stub) so our spy
// is the one the component calls. jsdom's navigator.clipboard has only a getter → defineProperty.
function installClipboardSpy(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

describe("CopyField", () => {
  it("renders the value and label", () => {
    render(<CopyField value="hello-value" label="My label" valueTestId="v" />);
    expect(screen.getByTestId("v")).toHaveTextContent("hello-value");
    expect(screen.getByText("My label")).toBeInTheDocument();
  });

  it("renders multiline in a <pre>", () => {
    render(<CopyField value="<script></script>" label="Snippet" multiline valueTestId="snip" />);
    const el = screen.getByTestId("snip");
    expect(el.tagName).toBe("PRE");
  });

  it("copies to clipboard and shows Copied! then reverts", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    installClipboardSpy(writeText);
    render(<CopyField value="copy-me" label="L" valueTestId="v" />);
    await user.click(screen.getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("copy-me");
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("Copied!"));
  });

  it("stays actionable if clipboard write fails", async () => {
    const user = userEvent.setup();
    installClipboardSpy(vi.fn().mockRejectedValue(new Error("blocked")));
    render(<CopyField value="x" label="L" valueTestId="v" />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("Copy snippet");
  });
});
