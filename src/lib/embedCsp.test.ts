// embedCsp.test.ts — regression + drift guard for the embedder CSP help block.
//
// Two things must stay true:
//   1. The documented directive set actually names the four directives an embedder needs, and the
//      hosts a plain read of the block promises (script/style/connect/frame-src).
//   2. Every host that IS a literal string in the widget's own source (public/embed/xch-tip.js —
//      esm.sh, api.coinset.org, the wasm compile/instantiate calls, the pinned WalletConnect
//      version) is still actually there. If a future change moves the widget to a different CDN,
//      API host, or WalletConnect version, this test catches the CSP doc going stale.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { EMBED_CSP, EMBED_CSP_DIRECTIVES } from "./embedCsp";

const widgetSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../public/embed/xch-tip.js"),
  "utf8",
);

describe("EMBED_CSP_DIRECTIVES", () => {
  it("documents exactly the four directives the widget needs, each properly terminated", () => {
    for (const value of Object.values(EMBED_CSP_DIRECTIVES)) {
      expect(value.trim().endsWith(";")).toBe(true);
    }
    expect(EMBED_CSP_DIRECTIVES.scriptSrc.startsWith("script-src ")).toBe(true);
    expect(EMBED_CSP_DIRECTIVES.styleSrc.startsWith("style-src ")).toBe(true);
    expect(EMBED_CSP_DIRECTIVES.connectSrc.startsWith("connect-src ")).toBe(true);
    expect(EMBED_CSP_DIRECTIVES.frameSrc.startsWith("frame-src ")).toBe(true);
  });

  it("script-src covers the script's own origin, the CDN it imports from, and wasm execution", () => {
    expect(EMBED_CSP_DIRECTIVES.scriptSrc).toContain("https://xchtip.app");
    expect(EMBED_CSP_DIRECTIVES.scriptSrc).toContain("https://esm.sh");
    expect(EMBED_CSP_DIRECTIVES.scriptSrc).toContain("'wasm-unsafe-eval'");
  });

  it("connect-src covers the chain RPC, the self-hosted wasm fetch, and the WalletConnect network", () => {
    expect(EMBED_CSP_DIRECTIVES.connectSrc).toContain("https://api.coinset.org");
    expect(EMBED_CSP_DIRECTIVES.connectSrc).toContain("https://xchtip.app");
    expect(EMBED_CSP_DIRECTIVES.connectSrc).toContain("wss://relay.walletconnect.org");
    expect(EMBED_CSP_DIRECTIVES.connectSrc).toContain("https://verify.walletconnect.org");
    expect(EMBED_CSP_DIRECTIVES.connectSrc).toContain("https://pulse.walletconnect.org");
    expect(EMBED_CSP_DIRECTIVES.connectSrc).toContain("https://explorer-api.walletconnect.com");
  });

  it("frame-src covers WalletConnect's anti-phishing Verify iframe", () => {
    expect(EMBED_CSP_DIRECTIVES.frameSrc).toContain("https://verify.walletconnect.org");
  });

  it("does NOT include hosts the widget has no code path for (media-src, dexie/xchtip img icons)", () => {
    expect(EMBED_CSP).not.toContain("media-src");
    expect(EMBED_CSP).not.toContain("icons.dexie.space");
    expect(EMBED_CSP).not.toContain("img-src");
  });

  it("joins into one block, one directive per line, in a stable order", () => {
    expect(EMBED_CSP.split("\n")).toEqual([
      EMBED_CSP_DIRECTIVES.scriptSrc,
      EMBED_CSP_DIRECTIVES.styleSrc,
      EMBED_CSP_DIRECTIVES.connectSrc,
      EMBED_CSP_DIRECTIVES.frameSrc,
    ]);
  });
});

describe("EMBED_CSP drift guard against the widget's own source", () => {
  it("esm.sh is still the CDN the widget imports WalletConnect + QR code from", () => {
    expect(widgetSource).toContain('"https://esm.sh/@walletconnect/sign-client@');
    expect(widgetSource).toContain('"https://esm.sh/qrcode@');
  });

  it("api.coinset.org is still the chain endpoint the widget posts to", () => {
    expect(widgetSource).toContain('var COINSET = "https://api.coinset.org"');
  });

  it("the widget still self-hosts + hand-instantiates its wasm (needs 'wasm-unsafe-eval')", () => {
    expect(widgetSource).toMatch(/WebAssembly\.compile/);
    expect(widgetSource).toMatch(/WebAssembly\.instantiate/);
  });

  it("the widget still injects an inline <style> block (needs style-src 'unsafe-inline')", () => {
    expect(widgetSource).toMatch(/document\.createElement\("style"\)/);
  });

  it("pins the WalletConnect sign-client version this CSP's relay/verify/pulse/explorer hosts were verified against", () => {
    expect(widgetSource).toContain("@walletconnect/sign-client@2.19.0");
  });
});
