import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };
const dAll = (a: string, b: string) => VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)));
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const H = Number(process.env.H ?? 0.1), D = Number(process.env.D ?? 0.25);
for (const g of ['#302F32', '#2E2D30', '#2C2B2E', '#2A292C', '#24222A']) {
  let wn = Infinity, wc = Infinity, who = '';
  for (const [n, f] of Object.entries(FILLS)) for (const look of [['', (x: string) => x], ['ash', (x: string) => mix(x, '#8F8C88', 0.1)], ['moss', (x: string) => mix(x, '#5E7F45', 0.06)]] as const) for (const fog of [['in sight', (x: string) => x], ['unexplored', (x: string) => mix(x, '#E8DCC2', H)], ['out of sight', (x: string) => desat(x, D)]] as const) {
    if (fog[0] === 'unexplored' && look[0] !== '') continue;
    const d = dAll(g, fog[1](look[1](f)));
    wn = Math.min(wn, d[0]!); const cv = Math.min(...d.slice(1)); if (cv < wc) { wc = cv; who = `${n} ${look[0]} ${fog[0]}`; }
  }
  console.log(`${g} L* ${labAs(g, 'normal')[0].toFixed(1)}: worst normal ${wn.toFixed(1)}, worst CVD ${wc.toFixed(1)} (${who}) ${wn >= 20 && wc >= 12 ? 'PASS' : 'fail'}; vs plain fills ${dAll(g, '#374C2B').map((x) => x.toFixed(1)).join('/')}`);
}
// fogged pairs among terrains, no washes
for (const [label, f] of [[`haze ${H}`, (x: string) => mix(x, '#E8DCC2', H)], [`desat ${D}`, (x: string) => desat(x, D)]] as const) {
  let n = Infinity, c = Infinity; const fl = Object.values(FILLS);
  for (const a of fl) for (const b of fl) if (a !== b) for (const [x, y] of [[f(a), f(b)], [f(a), b]]) { const d = dAll(x!, y!); n = Math.min(n, d[0]!); c = Math.min(c, ...d.slice(1)); }
  console.log(`terrain pairs under ${label}: ${n.toFixed(1)}/${c.toFixed(1)}`);
}
