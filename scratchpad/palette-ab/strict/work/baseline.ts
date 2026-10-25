import { TERRAINS, CURRENT, BANNERS, STATES, stOver, oklch, lab, chroma, hueLab, dN, dC, passes, bandOK, keylineFor, contrastRatio, GRANITE, MERE, f1, f3, fromOklch } from './lib.ts';
for (const t of TERRAINS) { const h = CURRENT[t]; const [L, C, H] = oklch(h); const l = lab(h); console.log(`${t.padEnd(10)} ${h} OKLCH ${f3(L)} ${f3(C)} ${f1(H)} | L* ${f1(l[0])} C* ${f1(chroma(h))} h ${f1(hueLab(h))} | rt ${fromOklch(L, C, H)}`); }
const mean = (f: (h: string) => number) => TERRAINS.reduce((s, t) => s + f(CURRENT[t]), 0) / 7;
console.log(`mean OKLCH C ${f3(mean((h) => oklch(h)[1]))}, mean C* ${f1(mean(chroma))}, max C* ${f1(Math.max(...TERRAINS.map((t) => chroma(CURRENT[t]))))}`);
let wn = 1e9, wc = 1e9, ws = 1e9, wsc = 1e9;
for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const a = CURRENT[TERRAINS[i]!], b = CURRENT[TERRAINS[j]!]; wn = Math.min(wn, dN(a, b)); wc = Math.min(wc, dC(a, b));
  for (const sa of STATES) for (const sb of STATES) { const x = stOver(a, sa, a), y = stOver(b, sb, b); ws = Math.min(ws, dN(x, y)); wsc = Math.min(wsc, dC(x, y)); } }
console.log(`raw pairs ${f1(wn)} / ${f1(wc)}; across states ${f1(ws)} / ${f1(wsc)}`);
let g = 1e9, gc = 1e9; for (const t of TERRAINS) for (const st of STATES) for (const gr of [GRANITE, MERE]) { const x = stOver(CURRENT[t], st, CURRENT[t]); g = Math.min(g, dN(x, gr)); gc = Math.min(gc, dC(x, gr)); }
console.log(`grounds vs fills (states) ${f1(g)} / ${f1(gc)}`);
let fails = 0, key = 0; for (const t of TERRAINS) for (const b of BANNERS) { const f = CURRENT[t]; if (!bandOK(b, f, keylineFor(f))) fails++; else if (!passes(b, f)) key++; }
console.log(`band rule raw: ${fails} fail, ${key} via keyline of ${7 * BANNERS.length}; keyline contrast min ${f1(Math.min(...TERRAINS.map((t) => contrastRatio(keylineFor(CURRENT[t]), CURRENT[t]))))}`);
