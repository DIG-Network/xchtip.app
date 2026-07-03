// Pure-logic tests for the shortener Lambda (no AWS). Run with `node --test` (see package.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeCode,
  validateTargetUrl,
  codeFromHost,
  isValidCode,
  CODE_ALPHABET,
  RESERVED_CODES,
} from "./lib.mjs";

test("makeCode produces codes only from the unambiguous alphabet, of the requested length", () => {
  const code = makeCode(6, () => 0.5);
  assert.equal(code.length, 6);
  for (const ch of code) assert.ok(CODE_ALPHABET.includes(ch));
  // Deterministic with a fixed RNG.
  assert.equal(makeCode(4, () => 0), CODE_ALPHABET[0].repeat(4));
});

test("validateTargetUrl accepts only https xchtip.app /jar/… URLs (no open redirect)", () => {
  const ok = "https://xchtip.app/jar/xch1abc?scheme=purple";
  assert.equal(validateTargetUrl(ok), ok);
  // www is accepted but canonicalized to the apex.
  assert.equal(
    validateTargetUrl("https://www.xchtip.app/jar/xch1abc"),
    "https://xchtip.app/jar/xch1abc",
  );
});

test("validateTargetUrl rejects everything that isn't an xchtip.app jar page", () => {
  for (const bad of [
    "https://evil.com/jar/xch1abc", // wrong host — the open-redirect guard
    "http://xchtip.app/jar/xch1abc", // not https
    "https://xchtip.app/", // not a jar path
    "https://xchtip.app/jarbogus", // not /jar/
    "https://xchtip.app/jar/", // no recipient segment
    "https://sub.xchtip.app/jar/x", // wrong host (a code host, not the apex)
    "not a url",
    "",
    null,
    undefined,
  ]) {
    assert.equal(validateTargetUrl(bad), null, `should reject: ${bad}`);
  }
});

test("codeFromHost extracts a valid code from <code>.xchtip.app and rejects the rest", () => {
  assert.equal(codeFromHost("abc234.xchtip.app"), "abc234");
  assert.equal(codeFromHost("ABC234.XCHTIP.APP"), "abc234"); // case-insensitive
  assert.equal(codeFromHost("abc234.xchtip.app:443"), "abc234"); // strips port
  // Rejections:
  assert.equal(codeFromHost("xchtip.app"), null); // apex
  assert.equal(codeFromHost("www.xchtip.app"), null); // reserved
  assert.equal(codeFromHost("api.xchtip.app"), null); // reserved
  assert.equal(codeFromHost("a.b.xchtip.app"), null); // multi-level
  assert.equal(codeFromHost("abc.evil.com"), null); // wrong suffix
  assert.equal(codeFromHost("ab!.xchtip.app"), null); // invalid char
  assert.equal(codeFromHost(""), null);
});

test("isValidCode enforces the alphabet + length bounds", () => {
  assert.ok(isValidCode("abc"));
  assert.ok(isValidCode("abcdef23"));
  assert.ok(!isValidCode("ab")); // too short
  assert.ok(!isValidCode("a".repeat(17))); // too long
  assert.ok(!isValidCode("ab0")); // 0 not in alphabet
  assert.ok(!isValidCode("AB2")); // uppercase not in alphabet
});

test("reserved codes are known", () => {
  assert.ok(RESERVED_CODES.has("www"));
  assert.ok(RESERVED_CODES.has("api"));
});
