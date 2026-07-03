// format.ts — tiny, pure display formatters (no DOM, no deps). Unit-tested in isolation.

/**
 * shortenMiddle — an elegant middle truncation for long opaque strings (addresses, ids) for DISPLAY
 * only: keep `lead` head chars + `tail` trailing chars, eliding the middle with an ellipsis
 * (`xch1qyqs…s0wg4qq`). The full value is always available elsewhere (a `title` attr / clipboard) —
 * this never destroys data, only shortens what's shown. A string already short enough to show whole
 * (≤ lead + tail + 1) is returned unchanged.
 */
export function shortenMiddle(input: unknown, lead = 8, tail = 7): string {
  const s = String(input == null ? "" : input).trim();
  if (s.length <= lead + tail + 1) return s;
  return `${s.slice(0, lead)}…${s.slice(-tail)}`;
}
