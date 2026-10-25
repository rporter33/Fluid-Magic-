// H13 floor (19.5 / 11.0, every approved state) for a palette under alternative paint amplitudes (mottle M and the Mountains relief wash).
import { TERRAINS, STATES, stOver, over, shadeL, dN, dC, f1, type T } from './lib.ts';
const P: Record<T, string> = JSON.parse(process.argv[2]!);
const opts: [string, Record<T, number>, number][] = [
  ['today: M 3/3/3/0/1/1/0, relief 0.08', { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 1, swamp: 1, wasteland: 0 }, 0.08],
  ['relief 0.05', { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 1, swamp: 1, wasteland: 0 }, 0.05],
  ['relief 0.04, swamp M 0', { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 1, swamp: 0, wasteland: 0 }, 0.04],
  ['mountains and swamp M 0, relief 0.04', { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 0, swamp: 0, wasteland: 0 }, 0.04],
  ['mountains and swamp M 0, relief 0.03', { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 0, swamp: 0, wasteland: 0 }, 0.03],
  ['mountains and swamp M 0, relief 0', { plains: 3, farmland: 3, forest: 3, hills: 0, mountains: 0, swamp: 0, wasteland: 0 }, 0],
  ['plains M 2, mountains and swamp M 0, relief 0.04', { plains: 2, farmland: 3, forest: 3, hills: 0, mountains: 0, swamp: 0, wasteland: 0 }, 0.04],
  ['plains M 2, forest 2, mountains and swamp M 0, relief 0.04', { plains: 2, farmland: 3, forest: 2, hills: 0, mountains: 0, swamp: 0, wasteland: 0 }, 0.04],
];
for (const [name, M, rw] of opts) {
  const vars = (t: T) => { const f = P[t]; const v = [f, shadeL(f, 0.55 * M[t]), shadeL(f, -0.55 * M[t])]; if (t === 'mountains' && rw) v.push(over(f, '#3A4466', rw)); return v; };
  let wn = { v: 1e9, s: '' }, wc = { v: 1e9, s: '' }, under = 0;
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const A = TERRAINS[i]!, B = TERRAINS[j]!; for (const sa of STATES) for (const sb of STATES) for (const a0 of vars(A)) for (const b0 of vars(B)) { const a = stOver(a0, sa, P[A]), b = stOver(b0, sb, P[B]); const n = dN(a, b), c = dC(a, b); if (n < 19.5 || c < 11) under++; if (n < wn.v) wn = { v: n, s: `${A}/${sa} vs ${B}/${sb}` }; if (c < wc.v) wc = { v: c, s: `${A}/${sa} vs ${B}/${sb}` }; } }
  console.log(`${name}: ${f1(wn.v)} (${wn.s}) / ${f1(wc.v)} (${wc.s}); extreme pairs under the floor: ${under} ${wn.v >= 19.5 && wc.v >= 11 ? 'PASS' : 'fail'}`);
}
