// tipMemo.test.ts — regression guard for #1265: every tip coin (recipient AND fee, on BOTH the XCH
// and CAT payment paths) MUST carry the memo "Tipped via xchtip.app, Enjoy!" as its SECOND memo
// element, with the receiver's own puzzle-hash hint kept FIRST (memo[0]) so the coin stays
// discoverable by hint like any normal hinted send. Change coins are not tips and carry no memo.
//
// The widget is a single dependency-free <script> (no module exports — see its header DRY note), so
// this pins the exact source shape rather than executing the wasm spend builder; a change to the
// memo construction that breaks the hint-first/text-second contract fails this test immediately.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const widgetSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../public/embed/xch-tip.js"),
  "utf8",
);

describe("tip memo — shared constant", () => {
  it("defines TIP_MEMO as the exact tip note, encoded once", () => {
    expect(widgetSource).toContain(
      'var TIP_MEMO = new TextEncoder().encode("Tipped via xchtip.app, Enjoy!");',
    );
  });
});

describe("tip memo — XCH path (buildXchPayment)", () => {
  it("puts [recipient hint, TIP_MEMO] on the recipient coin", () => {
    expect(widgetSource).toContain(
      "conditions.push(clvm.createCoin(recipientPhBytes, split.net, clvm.list([clvm.atom(recipientPhBytes), clvm.atom(TIP_MEMO)])));",
    );
  });

  it("puts [fee hint, TIP_MEMO] on the fee coin", () => {
    expect(widgetSource).toContain(
      "conditions.push(clvm.createCoin(feePhBytes, split.fee, clvm.list([clvm.atom(feePhBytes), clvm.atom(TIP_MEMO)])));",
    );
  });

  it("leaves the change coin memo-less (not a tip)", () => {
    expect(widgetSource).toContain(
      "if (change > 0n) conditions.push(clvm.createCoin(leadPhBytes, change, clvm.nil()));",
    );
  });
});

describe("tip memo — CAT path (buildCatPayment)", () => {
  it("keeps the receiver hint as memo[0] and appends TIP_MEMO as memo[1] on the recipient coin", () => {
    expect(widgetSource).toContain(
      "var memoProgram = clvm.list([clvm.atom(recipientPhBytes), clvm.atom(TIP_MEMO)]);",
    );
  });

  it("keeps the fee hint as memo[0] and appends TIP_MEMO as memo[1] on the fee coin", () => {
    expect(widgetSource).toContain(
      "var feeMemo = clvm.list([clvm.atom(feePhBytes), clvm.atom(TIP_MEMO)]);",
    );
  });
});
