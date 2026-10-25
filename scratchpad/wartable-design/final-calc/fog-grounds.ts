import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };
const dAll = (a: string, b: string) => VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)));
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
for (const g of ['#302F32', '#24222A']) for (const [label, f] of [['haze 6%', (h: string) => mix(h, '#E8DCC2', 0.06)], ['desat 15%', (h: string) => desat(h, 0.15)], ['ash 10% + desat 15%', (h: string) => desat(mix(h, '#8F8C88', 0.1), 0.15)], ['moss 6% + desat 15%', (h: string) => desat(mix(h, '#5E7F45', 0.06), 0.15)]] as const) {
  let worst = { n: Infinity, c: Infinity, who: '' };
  for (const [n, c] of Object.entries(FILLS)) { const d = dAll(g, f(c)); if (d[0]! < worst.n) worst.n = d[0]!; const cv = Math.min(...d.slice(1)); if (cv < worst.c) { worst.c = cv; worst.who = n; } }
  console.log(`${g} vs fills under ${label}: worst normal ${worst.n.toFixed(1)}, worst CVD ${worst.c.toFixed(1)} (${worst.who}) ${worst.n >= 20 && worst.c >= 12 ? 'PASS' : 'fail'}`);
}
// washed + hazed/desat pairs among terrains (fog over land looks)
let n = Infinity, c = Infinity;
const looks = [(h: string) => h, (h: string) => mix(h, '#8F8C88', 0.1), (h: string) => mix(h, '#5E7F45', 0.06)];
const fogs = [(h: string) => h, (h: string) => mix(h, '#E8DCC2', 0.06), (h: string) => desat(h, 0.15)];
const fl = Object.values(FILLS);
for (const a of fl) for (const b of fl) if (a !== b) for (const la of looks) for (const lb of looks) for (const fa of fogs) for (const fb of fogs) { const d = dAll(fa(la(a)), fb(lb(b))); n = Math.min(n, d[0]!); c = Math.min(c, ...d.slice(1)); }
console.log(`every terrain pair with any land look and any fog state: worst normal ${n.toFixed(1)}, worst CVD ${c.toFixed(1)}`);
