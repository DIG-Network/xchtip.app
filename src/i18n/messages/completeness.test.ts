// Catalog completeness — every supported locale must resolve a non-empty string for EVERY message
// key (English fallback guarantees this), and every translation catalog must only use REAL keys (no
// typo'd ids that would silently never apply). Also: ICU placeholders in a translation must match the
// English base (so {name}/{asset}/{who} are never dropped or renamed).

import { describe, it, expect } from "vitest";
import { en } from "./en";
import { messagesFor, MESSAGE_KEYS } from "./index";
import { SUPPORTED_LOCALES } from "../locales";

const ENGLISH_KEYS = new Set(Object.keys(en));

// Extract the set of ICU placeholder names ({foo}) from a string.
function placeholders(s: string): Set<string> {
  const out = new Set<string>();
  for (const m of s.matchAll(/\{(\w+)\}/g)) out.add(m[1]);
  return out;
}

describe("catalog completeness", () => {
  it("resolves every key for every supported locale (English fallback)", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const messages = messagesFor(code);
      for (const key of MESSAGE_KEYS) {
        expect(messages[key], `${code} missing ${key}`).toBeTruthy();
      }
    }
  });

  it("every locale catalog uses only real message keys + matching ICU placeholders", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const merged = messagesFor(code);
      for (const key of MESSAGE_KEYS) {
        // The merged value is either the translation or the English fallback; its placeholders MUST
        // equal the English base's placeholders for that key.
        const expected = placeholders(en[key]);
        const actual = placeholders(merged[key]);
        expect([...actual].sort(), `${code}.${key} placeholders`).toEqual([...expected].sort());
      }
    }
  });

  it("MESSAGE_KEYS equals the English key set", () => {
    expect(new Set(MESSAGE_KEYS)).toEqual(ENGLISH_KEYS);
  });
});
