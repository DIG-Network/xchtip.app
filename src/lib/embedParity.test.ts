// embedParity.test.ts — drift guard for the values the zero-build embed necessarily DUPLICATES.
//
// public/embed/xch-tip.js ships as one dependency-free <script> for arbitrary third-party pages, so
// it cannot import the app's src/lib/* TypeScript. A few pure CONSTANTS are therefore hand-copied
// into the widget (see its header "DRY / DUPLICATION NOTE"). These assertions pin those copies equal
// to their canonical source, so a change to one side without the other FAILS CI instead of silently
// drifting — the tip widget would otherwise render the wrong brand color or mis-validate an address.
//
// Companion guard: embedCsp.test.ts pins the widget's host/CSP literals the same way.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GREEN_SCHEME, PURPLE_SCHEME, ORANGE_SCHEME } from "./schemes";

const here = dirname(fileURLToPath(import.meta.url));
const widgetSource = readFileSync(join(here, "../../public/embed/xch-tip.js"), "utf8");
const bech32Source = readFileSync(join(here, "./bech32m.ts"), "utf8");

describe("embed named-scheme parity with src/lib/schemes.ts", () => {
  // Every canonical scheme's gradient endpoints + shadow must appear verbatim in the widget's SCHEMES
  // table, so a preset (green/purple/orange) renders the identical brand color on the page and embed.
  it.each([
    ["green", GREEN_SCHEME],
    ["purple", PURPLE_SCHEME],
    ["orange", ORANGE_SCHEME],
  ])("keeps the %s scheme triplet byte-identical", (_name, scheme) => {
    expect(widgetSource).toContain(scheme.gradientFrom);
    expect(widgetSource).toContain(scheme.gradientTo);
    expect(widgetSource).toContain(scheme.shadow);
  });
});

describe("embed bech32m parity with src/lib/bech32m.ts", () => {
  // The bech32m checksum is only correct if BOTH copies use the same charset + generator table; a
  // mismatch would make the widget accept malformed addresses or reject valid ones.
  it("shares the exact bech32 charset", () => {
    expect(bech32Source).toContain('"qpzry9x8gf2tvdw0s3jn54khce6mua7l"');
    expect(widgetSource).toContain('"qpzry9x8gf2tvdw0s3jn54khce6mua7l"');
  });

  it("shares the exact polymod GEN table", () => {
    // The five BCH generator constants, in order — the load-bearing shared value.
    const gen = ["0x3b6a57b2", "0x26508e6d", "0x1ea119fa", "0x3d4233dd", "0x2a1462b3"];
    const genList = gen.join(", ");
    expect(bech32Source).toContain(genList);
    expect(widgetSource).toContain(genList);
  });
});
