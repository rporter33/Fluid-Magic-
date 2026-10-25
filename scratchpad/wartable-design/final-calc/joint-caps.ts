// Joint caps: land-look washes combined with fog (unexplored haze has no land look; out of sight keeps it).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };
const cache = new Map<string, readonly [number, number, number][]>();
const labs = (h: string) => { let v = cache.get(h); if (!v) { v = VISIONS.map((x) => labAs(h, x)); cache.set(h, v); } return v; };
const FILLS = ['#C1D29F', '#EEBA3A', '#374C2B', '#856824', '#8DA4AD', '#1A727A', '#AE897F'];
function check(c: number, t: number, h: number, d: number, grounds: string[]) {
  // states: unexplored (haze, no land look), explored in sight (land look), explored out of sight (land look, desat)
  const states: ((f: string) => string)[] = [(f) => mix(f, '#E8DCC2', h)];
  for (const look of [(f: string) => f, (f: string) => mix(f, '#8F8C88', c), (f: string) => mix(f, '#5E7F45', t)]) { states.push((f) => look(f)); states.push((f) => desat(look(f), d)); }
  let n = Infinity, cv = Infinity;
  const colors = FILLS.map((f) => states.map((s) => s(f)));
  for (let i = 0; i < FILLS.length; i++) for (let j = 0; j < FILLS.length; j++) if (i !== j) for (const a of colors[i]!) for (const b of colors[j]!) { const la = labs(a), lb = labs(b); n = Math.min(n, deltaE2000(la[0]!, lb[0]!)); for (let k = 1; k < 4; k++) cv = Math.min(cv, deltaE2000(la[k]!, lb[k]!)); }
  let gn = Infinity, gc = Infinity;
  for (const g of grounds) for (const row of colors) for (const a of row) { const la = labs(a), lg = labs(g); gn = Math.min(gn, deltaE2000(la[0]!, lg[0]!)); for (let k = 1; k < 4; k++) gc = Math.min(gc, deltaE2000(la[k]!, lg[k]!)); }
  return { n, cv, gn, gc };
}
for (const granite of ['#302F32', '#2E2D30', '#2C2B2E']) for (const [c, t] of [[0.1, 0.06], [0.08, 0.05]] as const) for (const h of [0.05, 0.06]) for (const d of [0.08, 0.1, 0.12, 0.15]) {
  const r = check(c, t, h, d, [granite, '#24222A']);
  const ok = r.n >= 20 && r.cv >= 12 && r.gn >= 20 && r.gc >= 12;
  if (ok || (granite === '#302F32' && c === 0.1)) console.log(`granite ${granite} ash ${c} moss ${t} haze ${h} desat ${d}: terrain pairs ${r.n.toFixed(1)}/${r.cv.toFixed(1)}; grounds ${r.gn.toFixed(1)}/${r.gc.toFixed(1)} ${ok ? 'PASS' : 'fail'}`);
}
