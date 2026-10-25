// The data ramp (R16: #4C5E96 #8170AC #C4808E #E6AC6E #F8E6A6) against the proposed fills, and a search for a 4th stop at the same
// OKLCH lightness that keeps the ramp as far from every fill as today's ramp is from today's fills.
import { TERRAINS, CURRENT, oklch, fromOklch, rgb, toHex, dN, dC, passes, GRANITE, MERE, f1, f3, type T } from './lib.ts';
const P: Record<T, string> = JSON.parse(process.argv[2]!);
const rampOf = (stops: string[]) => Array.from({ length: 21 }, (_, i) => { const x = Math.min(0.9999, i / 20) * 4, k = Math.floor(x), fr = x - k, a = rgb(stops[k]!), b = rgb(stops[k + 1]!); return toHex(a.map((v, j) => v + (b[j]! - v) * fr)); });
const worst = (ramp: string[], fills: Record<T, string>) => { let n = { v: 1e9, s: '' }, c = { v: 1e9, s: '' }; ramp.forEach((r, i) => { for (const t of TERRAINS) { const a = dN(r, fills[t]), b = dC(r, fills[t]); if (a < n.v) n = { v: a, s: `t=${i / 20} ${r} vs ${t}` }; if (b < c.v) c = { v: b, s: `t=${i / 20} ${r} vs ${t}` }; } }); return { n, c }; };
const R0 = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
const show = (lbl: string, stops: string[], fills: Record<T, string>) => { const w = worst(rampOf(stops), fills); const g = rampOf(stops).every((r) => passes(GRANITE, r) && passes(MERE, r)); console.log(`${lbl}: closest ${f1(w.n.v)} (${w.n.s}) / ${f1(w.c.v)} (${w.c.s}); grounds ${g ? 'pass' : 'FAIL'}`); return w; };
show('today\'s ramp vs today\'s fills', R0, CURRENT);
show('today\'s ramp vs proposed fills', R0, P);
const [L4] = oklch(R0[3]!); let best: { s: string; v: number } | null = null;
for (let h = 20; h <= 75; h += 1) for (let C = 0.04; C <= 0.16; C += 0.004) { const x = fromOklch(L4, C, h); if (!x) continue; const st = [...R0]; st[3] = x; const w = worst(rampOf(st), P); const v = Math.min(w.n.v / 20, w.c.v / 12); if (!best || v > best.v) best = { s: x, v }; }
console.log(`best 4th stop at OKLCH L ${f3(L4)}: ${best!.s}`); show('ramp with that stop vs proposed fills', [R0[0]!, R0[1]!, R0[2]!, best!.s, R0[4]!], P);
