// Prototype of the share code: a bit-packed GodRecord, CRC-16, base64url, "FM1-" prefix.
class W { constructor() { this.bits = []; } put(v, n) { for (let i = n - 1; i >= 0; i--) this.bits.push((v >> i) & 1); }
  bytes() { const out = []; for (let i = 0; i < this.bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] ?? 0); out.push(b); } return out; } }
class Rd { constructor(bytes) { this.bytes = bytes; this.i = 0; } get(n) { let v = 0; for (let k = 0; k < n; k++) { const bit = (this.bytes[this.i >> 3] >> (7 - (this.i & 7))) & 1; v = (v << 1) | bit; this.i++; } return v; } }
const crc16 = (bytes) => { let c = 0xffff; for (const b of bytes) { c ^= b << 8; for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; } return c; };
const b64u = (bytes) => Buffer.from(bytes).toString('base64url');
const str = (w, s, lenBits) => { const u = [...Buffer.from(s, 'utf8')]; w.put(u.length, lenBits); for (const b of u) w.put(b, 8); };
const rstr = (r, lenBits) => { const n = r.get(lenBits); const u = []; for (let i = 0; i < n; i++) u.push(r.get(8)); return Buffer.from(u).toString('utf8'); };
const COLORS = ['W', 'U', 'B', 'R', 'G'], AXES = ['order', 'lore', 'growth', 'wild', 'sanctity'], AW = ['awake', 'dormant', 'imprisoned'];
function encode(g) {
  const w = new W();
  w.put(1, 4); w.put(g.nation, 6); w.put(g.chassis, 7);
  for (const c of COLORS) w.put(g.pips[c] ?? 0, 3);
  w.put(g.dominion, 4); for (const a of AXES) w.put((g.scales[a] ?? 0) + 3, 3); w.put(AW.indexOf(g.awakening), 2);
  w.put(g.breath, 3); w.put(g.blessings.length, 4); for (const b of g.blessings) w.put(b, 7);
  w.put(g.boons, 8); if (g.boons & 1) w.put(g.springColor, 3);
  w.put(g.look.parts.length, 3); for (const p of g.look.parts) w.put(p, 4);
  w.put(g.look.material, 4); w.put(g.look.metal, 3); w.put(g.look.accent, 4);
  w.put(g.look.sliders.length, 3); for (const [id, v] of g.look.sliders) { w.put(id, 3); w.put(v + 2, 3); }
  w.put(g.look.pose, 2); w.put(g.look.aura, 3); w.put(g.look.flourish, 3); w.put(g.look.markings, 4);
  w.put(g.sigil.frame, 3); w.put(g.sigil.charge, 5); w.put(g.sigil.division, 3);
  w.put(g.pronoun, 2); str(w, g.name, 6); str(w, g.epithet, 6); str(w, g.title, 6);
  w.put(g.lore === null ? 0 : 1, 1); if (g.lore !== null) str(w, g.lore, 10);
  const body = w.bytes(); const c = crc16(body);
  return 'FM1-' + b64u([...body, c >> 8, c & 255]);
}
function decode(code) {
  const raw = [...Buffer.from(code.slice(4), 'base64url')]; const body = raw.slice(0, -2);
  if (crc16(body) !== ((raw.at(-2) << 8) | raw.at(-1))) throw new Error('checksum');
  const r = new Rd(body); const g = { version: r.get(4), nation: r.get(6), chassis: r.get(7), pips: {}, scales: {} };
  for (const c of COLORS) g.pips[c] = r.get(3); g.dominion = r.get(4); for (const a of AXES) g.scales[a] = r.get(3) - 3; g.awakening = AW[r.get(2)];
  return g;
}
const sample = { nation: 0, chassis: 8, pips: { R: 4 }, dominion: 4, scales: { lore: -3, order: -3 }, awakening: 'awake', breath: 0,
  blessings: [3], boons: 0b100000, springColor: 0, look: { parts: [2, 1, 0, 2], material: 5, metal: 3, accent: 6, sliders: [[0, 1], [2, -1]], pose: 1, aura: 3, flourish: 2, markings: 4 },
  sigil: { frame: 2, charge: 7, division: 3 }, pronoun: 0, name: 'Vulkra', epithet: 'the Unburnt', title: 'Lord of Cinders', lore: null };
const code = encode(sample);
console.log(code, code.length, 'chars');
console.log(JSON.stringify(decode(code)));
const big = { ...sample, name: 'Ysolde Ashenmere', epithet: 'the Undying Flame', title: 'Mother of the Ninth Pyre', lore: 'Bound beneath the ash for three years, she rises to a world of Fury and Turmoil, and the fields burn where she walks.' };
const c2 = encode(big); console.log(c2.length, 'chars with long names and a custom lore line');
const nameless = encode({ ...sample, name: '', epithet: '', title: '' }); console.log(nameless, nameless.length, 'chars with no identity text');
try { decode(code.slice(0, 10) + (code[10] === 'A' ? 'B' : 'A') + code.slice(11)); } catch (e) { console.log('typo detected:', e.message); }
