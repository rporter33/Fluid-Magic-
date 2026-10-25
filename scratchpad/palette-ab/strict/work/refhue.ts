// How far each fill's OKLCH hue sits from the reference image's median hue for its family (refsample.json), current vs proposed.
import { readFileSync } from 'node:fs';
import { TERRAINS, CURRENT, oklch, f1, type T } from './lib.ts';
const P: Record<T, string> = JSON.parse(process.argv[2]!);
const ref = JSON.parse(readFileSync(new URL('./refsample.json', import.meta.url), 'utf8')) as Record<string, { oklch: number[] }>;
const key: Record<T, string> = { plains: 'plains/grass', farmland: 'farmland fields', forest: 'forest canopy', hills: 'hills (brown humps)', mountains: 'mountains (Stormhold)', swamp: 'swamp (Mistmarsh)', wasteland: 'barrens (wasteland)' };
const dh = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
for (const t of TERRAINS) { const r = ref[key[t]]!.oklch; const c = oklch(CURRENT[t]), p = oklch(P[t]); console.log(`${t.padEnd(10)} reference h ${f1(r[2]!)} C ${r[1]!.toFixed(3)} L ${r[0]!.toFixed(3)} | current h ${f1(c[2])} (off ${f1(dh(c[2], r[2]!))}) C ${c[1].toFixed(3)} | proposed h ${f1(p[2])} (off ${f1(dh(p[2], r[2]!))}) C ${p[1].toFixed(3)}`); }
