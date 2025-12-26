// help taken from ChatGPT free version

// --- Inputs (same as yours) ---
const B64_ACCESS_KEY: string = `SSBMb3ZlIFF1ZWVuIE1lZHVzYSAsIFl1biBZdW4gYW5kIEx1IFh1ZXFpIHNvIG11Y2ggdGhleSBh
cmUgbXkgYmVzdCBvZiBiZXN0IGZlbWFsZSBjaGFyZWN0b3JzIGluIHRoZSBBbmltZSB3b3JsZCAs
IFF1ZWVuIE1lZHVzYSBhbmQgWXVuIFl1biBmcm9tIGJhdHRsZSB0aHJvdWdoIHRoZSBoZWF2ZW5z
IGFuZCBMdSBYdWVxaSBmcm9tIEphZGUgRHluYXN0eS4K`;

const HEX_ACCESS_KEY: string = `0000000 2049 6f4c 6576 5120 6575 6e65 4d20 6465
0000010 7375 2061 202c 7559 206e 7559 206e 6e61
0000020 2064 754c 5820 6575 6971 7320 206f 756d
0000030 6863 7420 6568 2079 7261 2065 796d 6220
0000040 7365 2074 666f 6220 7365 2074 6566 616d
0000050 656c 6320 6168 6572 7463 726f 2073 6e69
0000060 7420 6568 4120 696e 656d 7720 726f 646c
0000070 2c20 5120 6575 6e65 4d20 6465 7375 2061
0000080 6e61 2064 7559 206e 7559 206e 7266 6d6f
0000090 6220 7461 6c74 2065 6874 6f72 6775 2068
00000a0 6874 2065 6568 7661 6e65 2073 6e61 2064
00000b0 754c 5820 6575 6971 6620 6f72 206d 614a
00000c0 6564 4420 6e79 7361 7974 0a2e          
00000cc`;

// --- Helpers ---

/**
 * Decodes a Base64-encoded string into a standard UTF-8 string.
 *
 * Purpose:
 * Converts a Base64 string back into readable text, handling both browser and Node.js environments.
 * It ensures that whitespace in the input is ignored and supports different decoding fallbacks.
 *
 * Parameters:
 * @param b64 - The Base64-encoded string to decode. Can contain spaces or line breaks, which will be ignored.
 *
 * Returns:
 * - A UTF-8 string representing the decoded content of the Base64 input.
 *
 * Dependencies:
 * - In browsers: relies on `atob` and `TextDecoder`.
 * - In Node.js: relies on `Buffer`.
 * - No DOM elements are required; works purely with strings and standard APIs.
 *
 * Notes:
 * - Handles uncommon fallback cases by decoding percent-encoded bytes if standard methods aren't available.
 */

function decodeBase64(b64: string): string {
  const cleaned = b64.replace(/\s+/g, '');
  // Prefer TextDecoder + atob (browser). Fall back to Buffer (Node).
  if (typeof atob === 'function' && typeof TextDecoder !== 'undefined') {
    const bin = atob(cleaned);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(cleaned, 'base64').toString('utf8');
  }
  // last-resort (rare)
  return decodeURIComponent(
    Array.prototype.map
      .call(
        atob(cleaned),
        (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      )
      .join('')
  );
}

/**
 * Decodes a hexadecimal string or dump into a readable UTF-8 string.
 *
 * Purpose:
 * Converts a hex dump (possibly containing 2- or 4-digit hex codes, such as little-endian 16-bit values)
 * into a normal string by interpreting the hex values as bytes.
 *
 * Parameters:
 * @param hexDump - The string containing hexadecimal values, possibly with extra characters or offsets.
 *                  Only 2- or 4-digit hex sequences are processed.
 *
 * Returns:
 * - A UTF-8 string decoded from the provided hexadecimal bytes.
 *
 * Dependencies:
 * - Uses the standard `TextDecoder` if available for UTF-8 decoding.
 * - No DOM elements or browser-specific APIs are strictly required; works in pure JS environments.
 *
 * Notes:
 * - 4-digit hex sequences are treated as little-endian and reordered to correct byte order.
 * - Provides a fallback using `String.fromCharCode` for environments without `TextDecoder`.
 */

function decodeHex(hexDump: string): string {
  // Pick up only groups of 2 or 4 hex digits (skips long offset tokens)
  const tokens = hexDump.match(/\b[0-9a-fA-F]{2,4}\b/g) || [];

  // Swap bytes inside 4-digit tokens (little-endian 16-bit -> correct byte order)
  const normalizedHex = tokens
    .map((t) => (t.length === 4 ? t.slice(2) + t.slice(0, 2) : t)) // use slice, not substr
    .join('');

  // Convert to bytes
  const byteCount = normalizedHex.length / 2;
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(normalizedHex.slice(i * 2, i * 2 + 2), 16);
  }

  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  } else {
    // fallback for very old environments
    let out = '';
    for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return out;
  }
}

// --- Use them ---

/**
 * Internal system keys and verification setup.
 *
 * Purpose:
 * This snippet decodes internal access keys from Base64 and Hex representations,
 * verifies that they match, and defines a unique symbol for system-level access.
 * The symbol is then exported for controlled internal use only.
 *
 * Constants:
 * @const _B64_ACCESS_KEY - String decoded from Base64.
 * @const _HEX_ACCESS_KEY - String decoded from Hex.
 * @const SYSTEM_INTERNAL_ACCESS - Unique symbol representing internal access.
 * @const DEV_INTERNAL_ACCESS - Exported alias for internal development access.
 *
 * Behavior:
 * - Throws an error if the Base64 and Hex decoded values differ.
 *
 * Dependencies:
 * - Uses `decodeBase64` and `decodeHex` helper functions.
 * - Pure logic; no DOM or graphics API usage.
 */

const _B64_ACCESS_KEY = decodeBase64(B64_ACCESS_KEY);
const _HEX_ACCESS_KEY = decodeHex(HEX_ACCESS_KEY);

// ✅ They should be the same
if (_B64_ACCESS_KEY !== _HEX_ACCESS_KEY) {
  throw new Error('Decoded values are not the same!');
}

// Internal system-only symbol
const SYSTEM_INTERNAL_ACCESS: unique symbol = Symbol(_B64_ACCESS_KEY);
export const DEV_INTERNAL_ACCESS: symbol = SYSTEM_INTERNAL_ACCESS;

/**
 * Ensures that a function or resource is accessed only with a valid internal key.
 *
 * Purpose:
 * This function acts as a security gate for internal or system-level operations.
 * It verifies that the caller provides the correct symbol key and that internal
 * secret values are consistent, preventing unauthorized usage.
 *
 * Parameters:
 * @param key - A unique `symbol` expected to match the internal `SYSTEM_INTERNAL_ACCESS`.
 *
 * Returns:
 * - Nothing if access is valid.
 * - Throws an error if the key is invalid or internal strings do not match.
 *
 * Dependencies:
 * - Depends on the existence of `SYSTEM_INTERNAL_ACCESS`, `_B64_ACCESS_KEY`, and `_HEX_ACCESS_KEY`.
 * - Pure logic; does not interact with DOM or graphics APIs.
 */

export function assertAccess(key: symbol): void {
  if (key !== SYSTEM_INTERNAL_ACCESS) {
    throw new Error('Unauthorized: invalid access symbol');
  }
  if (_B64_ACCESS_KEY !== _HEX_ACCESS_KEY) {
    throw new Error('Unauthorized: mismatched internal strings');
  }
  // If both checks pass → access granted
}
