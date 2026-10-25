// Largest wash alphas (no light on the sheet) that keep every pair of different terrains at
// >= 20 normal / >= 12 CVD, counting unwashed, same-nation and cross-nation pairs.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i]! * t));
const FILLS = ['#C1D29F', '#EEBA3A', '#374C2B', '#856824', '#8DA4AD', '#1A727A', '#AE897F'];
function worst(cw: number, tw: number) {
  const looks = [(f: string) => f, (f: string) => mix(f, '#8F8C88', cw), (f: string) => mix(f, '#5E7F45', tw)];
  let res = { n: Infinity, cvd: Infinity };
  for (let i = 0; i < FILLS.length; i++) for (let j = 0; j < FILLS.length; j++) {
    if (i === j) continue;
    for (const la of looks) for (const lb of looks) for (const v of VISIONS) {
      const d = deltaE2000(labAs(la(FILLS[i]!), v), labAs(lb(FILLS[j]!), v));
      if (v === 'normal') res.n = Math.min(res.n, d); else res.cvd = Math.min(res.cvd, d);
    }
  }
  return res;
}
for (const [c, t] of [[0.12, 0.08], [0.1, 0.06], [0.08, 0.06], [0.08, 0.05], [0.06, 0.05], [0.06, 0.04], [0.05, 0.04], [0.04, 0.03]] as const) {
  const w = worst(c, t);
  console.log(`Cinder ${c} Thornwood ${t}: worst normal ${w.n.toFixed(1)}, worst CVD ${w.cvd.toFixed(1)} ${w.n >= 20 && w.cvd >= 12 ? 'PASS' : 'fail'}`);
}
