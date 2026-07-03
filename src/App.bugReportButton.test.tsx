// Integration test for the shared @dignetwork/components bug-report widget wired into the app
// shell (App.tsx). The component's OWN behavior (form, screenshot capture, anti-spam contract) is
// tested in its own repo — this only verifies THIS app wires it correctly: mounted once at the
// shell, with the required `repo="xchtip.app"` prop, on every real human-facing view (the builder
// AND the /jar/* tip-jar pages), and OMITTED from raw mode (machine-readable snippet output with no
// chrome — not a page a human browses, so no floating UI belongs there).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderIntl as render } from "@/test/intl";
import { App } from "./App";
import { APP_VERSION } from "@/lib/version";

const bugReportButtonSpy = vi.fn();

vi.mock("@dignetwork/components", () => ({
  BugReportButton: (props: { repo: string; appVersion?: string }) => {
    bugReportButtonSpy(props);
    return <div data-testid="bugreport-launcher-stub" />;
  },
}));

const XCH = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq";

beforeEach(() => {
  bugReportButtonSpy.mockClear();
});

describe("App — bug-report widget integration", () => {
  it("mounts the bug-report button on the builder shell with repo=xchtip.app + the app version", () => {
    render(<App search="" origin="https://xchtip.test" />);
    expect(screen.getByTestId("bugreport-launcher-stub")).toBeInTheDocument();
    expect(bugReportButtonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "xchtip.app", appVersion: APP_VERSION }),
    );
  });

  it("mounts the bug-report button on a valid /jar/<recipient> tip page with the app version", () => {
    render(<App pathname={`/jar/${XCH}`} search="" origin="https://xchtip.test" />);
    expect(screen.getByTestId("jar-widget")).toBeInTheDocument();
    expect(screen.getByTestId("bugreport-launcher-stub")).toBeInTheDocument();
    expect(bugReportButtonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "xchtip.app", appVersion: APP_VERSION }),
    );
  });

  it("mounts the bug-report button on an invalid /jar/ link (error state)", () => {
    render(<App pathname="/jar/xch1bogus" search="" origin="https://xchtip.test" />);
    expect(screen.getByTestId("jar-error")).toBeInTheDocument();
    expect(screen.getByTestId("bugreport-launcher-stub")).toBeInTheDocument();
  });

  it("does NOT mount the bug-report button in raw mode (no chrome)", () => {
    render(<App search={`?recipient=${XCH}&asset=xch&raw=1`} origin="https://xchtip.test" />);
    expect(screen.getByTestId("raw-snippet")).toBeInTheDocument();
    expect(screen.queryByTestId("bugreport-launcher-stub")).not.toBeInTheDocument();
  });

  it("does NOT mount the bug-report button on the embed-preview route (iframe target, no chrome)", () => {
    render(<App pathname="/embed-preview" search={`recipient=${XCH}`} origin="https://xchtip.test" />);
    expect(screen.getByTestId("embed-preview-stage")).toBeInTheDocument();
    expect(screen.queryByTestId("bugreport-launcher-stub")).not.toBeInTheDocument();
  });
});
