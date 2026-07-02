// bech32m.ts — minimal, dependency-free bech32m decode + validate, for Chia addresses.
//
// A Chia receive address is a bech32m string: an HRP (human-readable part, `xch` on mainnet,
// `txch` on testnet) + separator `1` + a data part whose payload is a 32-byte puzzle hash. We
// validate the FULL bech32m encoding (charset, checksum with the bech32m constant, and a 32-byte
// decoded payload) so the builder never emits a snippet pointing a tip at a malformed address.
//
// This is a validator, not a full address library: it verifies structure + checksum and extracts
// the HRP + the 32-byte puzzle hash. The widget re-encodes / spends via chia_wallet_sdk_wasm at
// tip time; the builder only needs to confirm the address is well-formed here.
//
// PURE (no DOM, no network) → unit-tested in isolation and safe to inline into the embed snippet.

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32M_CONST = 0x2bc830a3;

// Polymod step of the BCH checksum (shared by bech32 + bech32m; only the final XOR constant differs).
function polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}

// convertBits — regroup a byte/5-bit stream into `toBits`-wide groups (the bech32 5↔8 packing).
function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || value >> fromBits !== 0) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv) !== 0) {
    return null;
  }
  return out;
}

/** A successfully decoded bech32m address. */
export interface DecodedAddress {
  /** The human-readable part, lowercased (`xch` on mainnet, `txch` on testnet). */
  hrp: string;
  /** The decoded payload bytes (32 for a Chia puzzle hash). */
  bytes: Uint8Array;
  /** The payload as lowercase hex (the puzzle hash). */
  hex: string;
}

/**
 * decodeBech32m — decode + checksum-verify a bech32m string. Returns the decoded address, or
 * null if the string is not a valid bech32m encoding (mixed case, bad charset, bad checksum,
 * missing separator, out-of-range length). Does NOT enforce a specific HRP or payload length —
 * `isChiaAddress` layers those policy checks on top.
 */
export function decodeBech32m(input: unknown): DecodedAddress | null {
  const s = String(input == null ? "" : input);
  // bech32 forbids mixed case; normalize only if consistently one case.
  if (s !== s.toLowerCase() && s !== s.toUpperCase()) return null;
  const lower = s.toLowerCase();
  if (lower.length < 8 || lower.length > 90) return null;
  const sep = lower.lastIndexOf("1");
  if (sep < 1 || sep + 7 > lower.length) return null;

  const hrp = lower.slice(0, sep);
  const dataPart = lower.slice(sep + 1);
  const data: number[] = [];
  for (const ch of dataPart) {
    const idx = CHARSET.indexOf(ch);
    if (idx === -1) return null;
    data.push(idx);
  }
  if (polymod([...hrpExpand(hrp), ...data]) !== BECH32M_CONST) return null;

  const payload = convertBits(data.slice(0, data.length - 6), 5, 8, false);
  if (!payload) return null;
  const bytes = Uint8Array.from(payload);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { hrp, bytes, hex };
}

/**
 * isChiaAddress — true when `input` is a valid bech32m Chia receive address: a good checksum, an
 * `xch`/`txch` HRP, and a 32-byte (puzzle-hash) payload. This is the recipient validation the
 * builder gates the snippet on.
 */
export function isChiaAddress(input: unknown): boolean {
  const decoded = decodeBech32m(input);
  if (!decoded) return false;
  if (decoded.hrp !== "xch" && decoded.hrp !== "txch") return false;
  return decoded.bytes.length === 32;
}
