// Share code v1, final field widths (final.md B.9). Full encode and decode, round trip over 2,000 random
// gods including every text field at its maximum, typo detection, and lengths.
class W { constructor() { this.bits = []; } put(v, n) { if (v < 0 || v >= 2 ** n || !Number.isInteger(v)) throw new Error(`value ${v} does not fit ${n} bits`); for (let i = n - 1; i >= 0; i--) this.bits.push(Math.floor(v / 2 ** i) & 1); }
  bytes() { const out = []; for (let i = 0; i < this.bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] ?? 0); out.push(b); } return out; } }
class Rd { constructor(bytes) { this.bytes = bytes; this.i = 0; } get(n) { let v = 0; for (let k = 0; k < n; k++) { if ((this.i >> 3) >= this.bytes.length) throw new Error('truncated'); const bit = (this.bytes[this.i >> 3] >> (7 - (this.i & 7))) & 1; v = v * 2 + bit; this.i++; } return v; } }
const crc16 = (bytes) => { let c = 0xffff; for (const b of bytes) { c ^= b << 8; for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; } return c; };
// Identity alphabet: 56 symbols, 6 bits each. Index 0 is never written (lengths carry the end).
const ALPHA = " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'-.";
const LIMITS = { name: [1, 24, 5], epithet: [0, 32, 6], title: [0, 32, 6] };
const MYTH_BYTES = 280, MYTH_LEN_BITS = 9;
const putText = (w, s, [min, max, bits]) => { if (s.length < min || s.length > max) throw new Error('length'); w.put(s.length, bits); for (const ch of s) { const k = ALPHA.indexOf(ch); if (k < 0) throw new Error(`char ${ch}`); w.put(k, 6); } };
const getText = (r, [min, max, bits]) => { const n = r.get(bits); if (n < min || n > max) throw new Error('length'); let s = ''; for (let i = 0; i < n; i++) { const k = r.get(6); if (k >= ALPHA.length) throw new Error('char'); s += ALPHA[k]; } return s; };
const COLORS = ['W', 'U', 'B', 'R', 'G'], AXES = ['order', 'lore', 'growth', 'wild', 'sanctity'], AW = ['awake', 'dormant', 'imprisoned'];
export function encode(g) {
  const w = new W();
  w.put(1, 4); w.put(g.nation, 6); w.put(g.chassis, 7);
  for (const c of COLORS) w.put(g.pips[c] ?? 0, 3);
  w.put(g.dominion, 4); for (const a of AXES) w.put((g.scales[a] ?? 0) + 3, 3); w.put(AW.indexOf(g.awakening), 2);
  w.put(g.blessings === null ? 0 : 1, 1);
  if (g.blessings !== null) { w.put(g.blessings.length, 6); for (const b of g.blessings) w.put(b, 8); }
  w.put(g.boons, 8); if (g.boons & 1) w.put(g.springColor, 3);
  w.put(g.look.parts.length, 3); for (const p of g.look.parts) w.put(p, 4);
  w.put(g.look.markings, 4); w.put(g.look.material, 4); w.put(g.look.metal, 4); w.put(g.look.accent, 4);
  w.put(g.look.sliders.length, 3); for (const [id, v] of g.look.sliders) { w.put(id, 3); w.put(v + 2, 3); }
  w.put(g.look.pose, 3); w.put(g.look.aura, 4); w.put(g.look.flourish, 4); w.put(g.look.breath, 3);
  w.put(g.nationLook.frame, 4); w.put(g.nationLook.charge, 8); w.put(g.nationLook.division, 4);
  w.put(g.identity.pronoun, 2);
  putText(w, g.identity.name, LIMITS.name); putText(w, g.identity.epithet, LIMITS.epithet); putText(w, g.identity.title, LIMITS.title);
  w.put(g.identity.myth === null ? 0 : 1, 1);
  if (g.identity.myth !== null) { const u = [...Buffer.from(g.identity.myth, 'utf8')]; if (u.length > MYTH_BYTES) throw new Error('myth bytes'); w.put(u.length, MYTH_LEN_BITS); for (const b of u) w.put(b, 8); }
  const body = w.bytes(); const c = crc16(body);
  return 'FM1-' + Buffer.from([...body, c >> 8, c & 255]).toString('base64url');
}
export function decode(code) {
  if (!code.startsWith('FM1-')) throw new Error('not a Fluid Magic god code');
  const raw = [...Buffer.from(code.slice(4), 'base64url')]; if (raw.length < 3) throw new Error('truncated');
  const body = raw.slice(0, -2);
  if (crc16(body) !== ((raw.at(-2) << 8) | raw.at(-1))) throw new Error('checksum');
  const r = new Rd(body);
  const version = r.get(4); if (version !== 1) throw new Error('This code was made with a newer version');
  const g = { nation: r.get(6), chassis: r.get(7), pips: {}, scales: {} };
  for (const c of COLORS) { const n = r.get(3); if (n) g.pips[c] = n; }
  g.dominion = r.get(4); for (const a of AXES) { const v = r.get(3) - 3; if (v) g.scales[a] = v; } g.awakening = AW[r.get(2)];
  if (r.get(1)) { const n = r.get(6); g.blessings = []; for (let i = 0; i < n; i++) g.blessings.push(r.get(8)); } else g.blessings = null;
  g.boons = r.get(8); g.springColor = g.boons & 1 ? r.get(3) : 0;
  const np = r.get(3); g.look = { parts: [] }; for (let i = 0; i < np; i++) g.look.parts.push(r.get(4));
  g.look.markings = r.get(4); g.look.material = r.get(4); g.look.metal = r.get(4); g.look.accent = r.get(4);
  const ns = r.get(3); g.look.sliders = []; for (let i = 0; i < ns; i++) g.look.sliders.push([r.get(3), r.get(3) - 2]);
  g.look.pose = r.get(3); g.look.aura = r.get(4); g.look.flourish = r.get(4); g.look.breath = r.get(3);
  g.nationLook = { frame: r.get(4), charge: r.get(8), division: r.get(4) };
  g.identity = { pronoun: r.get(2), name: getText(r, LIMITS.name), epithet: getText(r, LIMITS.epithet), title: getText(r, LIMITS.title) };
  if (r.get(1)) { const n = r.get(MYTH_LEN_BITS); if (n > MYTH_BYTES) throw new Error('myth bytes'); const u = []; for (let i = 0; i < n; i++) u.push(r.get(8)); g.identity.myth = Buffer.from(u).toString('utf8'); } else g.identity.myth = null;
  // trailing bits must be zero padding only
  while (r.i < body.length * 8) if (r.get(1)) throw new Error('trailing data');
  return g;
}
// --- tests ---
let seed = 1; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % n; };
const text = (min, max) => { const n = min + rnd(max - min + 1); let s = ''; for (let i = 0; i < n; i++) s += ALPHA[1 + rnd(ALPHA.length - 1)]; return s; };
const MYTH_GLYPHS = ['a', 'é', '火', '🔥', ' ', 'ß', 'ж'];
const myth = (maxBytes) => { let s = ''; for (;;) { const ch = MYTH_GLYPHS[rnd(MYTH_GLYPHS.length)]; if (Buffer.byteLength(s + ch) > maxBytes) return s; s += ch; } };
function randomGod(max) {
  const pips = {}; for (const c of COLORS) { const n = rnd(7); if (n) pips[c] = n; }
  const scales = {}; for (const a of AXES) { const v = rnd(7) - 3; if (v) scales[a] = v; }
  const nb = rnd(3) === 0 ? null : Array.from({ length: max ? 22 : rnd(6) }, () => rnd(256));
  const boons = rnd(8);
  return { nation: rnd(64), chassis: rnd(128), pips, dominion: 1 + rnd(10), scales, awakening: AW[rnd(3)], blessings: nb, boons, springColor: boons & 1 ? rnd(5) : 0,
    look: { parts: Array.from({ length: 4 + rnd(4) }, () => rnd(16)), markings: rnd(16), material: rnd(16), metal: rnd(16), accent: rnd(16),
      sliders: Array.from({ length: rnd(8) }, () => [rnd(8), rnd(5) - 2]), pose: rnd(8), aura: rnd(16), flourish: rnd(16), breath: rnd(6) },
    nationLook: { frame: rnd(16), charge: rnd(256), division: rnd(16) },
    identity: { pronoun: rnd(4), name: max ? text(24, 24) : text(1, 24), epithet: max ? text(32, 32) : text(0, 32), title: max ? text(32, 32) : text(0, 32),
      myth: max ? myth(MYTH_BYTES) : rnd(3) === 0 ? myth(rnd(MYTH_BYTES)) : null } };
}
export const _x = 1;
if (process.argv[1].endsWith("sharecode-final.mjs")) {
let ok = 0, longest = 0;
for (let i = 0; i < 2000; i++) {
  const g = randomGod(i % 10 === 0);
  const code = encode(g); longest = Math.max(longest, code.length);
  const d = decode(code); if (Object.keys(g).every((k) => JSON.stringify(d[k]) === JSON.stringify(g[k])) && Object.keys(d).length === Object.keys(g).length) ok++; else { for (const k of Object.keys(g)) if (JSON.stringify(d[k]) !== JSON.stringify(g[k])) console.log('DIFF', k, JSON.stringify(g[k]), '->', JSON.stringify(d[k])); break; }
}
console.log(`round trip: ${ok} / 2000; longest code ${longest} characters`);
const sample = { nation: 0, chassis: 8, pips: { R: 4 }, dominion: 4, scales: { order: -3, lore: -3 }, awakening: 'awake', blessings: null, boons: 0, springColor: 0,
  look: { parts: [2, 1, 0, 2], markings: 4, material: 5, metal: 3, accent: 6, sliders: [[0, 1], [2, -1]], pose: 1, aura: 1, flourish: 0, breath: 0 },
  nationLook: { frame: 2, charge: 7, division: 3 }, identity: { pronoun: 0, name: 'Vulkra', epithet: 'the Unburnt', title: 'Lord of Cinders', myth: null } };
const code = encode(sample); console.log('example:', code, code.length, 'characters');
const bare = encode({ ...sample, identity: { pronoun: 0, name: 'V', epithet: '', title: '', myth: null } }); console.log('one-letter name, no epithet or title:', bare.length, 'characters');
const maxi = encode({ ...sample, blessings: Array.from({ length: 22 }, (_, i) => i), identity: { pronoun: 2, name: 'X'.repeat(24), epithet: 'y'.repeat(32), title: 'z'.repeat(32), myth: '火'.repeat(93) } });
console.log('every text field at its maximum, 22 blessings:', maxi.length, 'characters');
let caught = 0, tries = 0;
for (let i = 4; i < code.length; i++) for (const ch of 'AQgw_-') { if (ch === code[i]) continue; tries++; try { decode(code.slice(0, i) + ch + code.slice(i + 1)); } catch { caught++; } }
console.log(`one-character changes refused: ${caught} / ${tries}`);
}
