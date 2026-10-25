// Joint caps with the final rule: unexplored = linen haze (no land look); in sight = land-look wash;
// out of sight = desaturated, wash hidden (motifs stay). Every pair of different terrains in any two states.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const labs = new Map<string, any>(); const L = (h: string) => { let v = labs.get(h); if (!v) { v = VISIONS.map((x) => labAs(h, x)); labs.set(h, v); } return v; };
function run(c: number, t: number, h: number, d: number) {
  const st = (f: string) => [['unexplored', mix(f, '#E8DCC2', h)], ['in sight', f], ['in sight ash', mix(f, '#8F8C88', c)], ['in sight moss', mix(f, '#5E7F45', t)], ['out of sight', desat(f, d)]] as const;
  let n = Infinity, cv = Infinity, who = '';
  const names = Object.keys(FILLS);
  for (const a of names) for (const b of names) if (a !== b) for (const [sa, ca] of st(FILLS[a]!)) for (const [sb, cb] of st(FILLS[b]!)) {
    const la = L(ca), lb = L(cb); n = Math.min(n, deltaE2000(la[0], lb[0]));
    for (let k = 1; k < 4; k++) { const x = deltaE2000(la[k], lb[k]); if (x < cv) { cv = x; who = `${a} ${sa} / ${b} ${sb} ${VISIONS[k]}`; } }
  }
  let gn = Infinity, gc = Infinity;
  for (const g of ['#2A292C', '#24222A']) for (const f of Object.values(FILLS)) for (const [, x] of st(f)) { const la = L(x), lg = L(g); gn = Math.min(gn, deltaE2000(la[0], lg[0])); for (let k = 1; k < 4; k++) gc = Math.min(gc, deltaE2000(la[k], lg[k])); }
  const ok = n >= 20 && cv >= 12 && gn >= 20 && gc >= 12;
  console.log(`ash ${c} moss ${t} haze ${h} desat ${d}: terrain pairs ${n.toFixed(1)}/${cv.toFixed(1)} (${who}); grounds ${gn.toFixed(1)}/${gc.toFixed(1)} ${ok ? 'PASS' : 'fail'}`);
}
for (const [c, t] of [[0.1, 0.06], [0.08, 0.05], [0.06, 0.04]] as const) for (const h of [0.04, 0.05, 0.06]) for (const d of [0.1, 0.15]) run(c, t, h, d);
