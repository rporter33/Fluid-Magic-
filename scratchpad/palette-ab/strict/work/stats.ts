import { TERRAINS, CURRENT, oklch, chroma, f3, f1, type T } from './lib.ts';
const P: Record<T, string> = JSON.parse(process.argv[2]!);
const m = (Q: Record<T, string>, f: (h: string) => number) => TERRAINS.reduce((s, t) => s + f(Q[t]), 0) / 7;
for (const [n, Q] of [['current', CURRENT], ['proposed', P]] as const) console.log(`${n}: mean OKLCH C ${f3(m(Q, (h) => oklch(h)[1]))}, RMS OKLCH C ${f3(Math.sqrt(m(Q, (h) => oklch(h)[1] ** 2)))}, mean C*ab ${f1(m(Q, chroma))}, max C*ab ${f1(Math.max(...TERRAINS.map((t) => chroma(Q[t]))))}`);
const a = m(CURRENT, (h) => oklch(h)[1]), b = m(P, (h) => oklch(h)[1]); console.log(`mean OKLCH C ${f1(100 * (1 - b / a))}% lower; mean C*ab ${f1(100 * (1 - m(P, chroma) / m(CURRENT, chroma)))}% lower`);
