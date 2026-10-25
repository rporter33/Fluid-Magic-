// A fingerprint of the whole game state, for determinism checks (docs/10-milestone-1.md,
// acceptance criterion 4) and save verification. Equal states give equal hashes; states that
// differ anywhere almost surely do not.

/** cyrb53: a fast 53-bit string hash, returned as 14 hex digits. */
function cyrb53(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const value = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return value.toString(16).padStart(14, '0');
}

/** Hash of the state's JSON form, which is also its save form. */
export function stateHash(state: unknown): string {
  return cyrb53(JSON.stringify(state));
}
