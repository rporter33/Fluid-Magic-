// Judge 1: search natural-looking impassable grounds (warm-grey granite, deep blue-green water)
// that pass docs/09's terrain-pair rule (CIEDE2000 >= 20 normal, >= 12 under each CVD) and
// stay apart from each other.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const TERRAIN: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const worst = (c: string) => {
  const out: Record<string, [number, string]> = {};
  for (const v of VISIONS) {
    let best = 1e9, who = '';
    for (const [n, h] of Object.entries(TERRAIN)) { const d = deltaE2000(labAs(c, v), labAs(h, v)); if (d < best) { best = d; who = n; } }
    out[v] = [best, who];
  }
  return out;
};
const pass = (w: Record<string, [number, string]>) => w.normal![0] >= 20 && w.protan![0] >= 12 && w.deutan![0] >= 12 && w.tritan![0] >= 12;
const fmt = (c: string) => { const w = worst(c); return `${c} L*${labAs(c, 'normal')[0].toFixed(1)} n ${w.normal![0].toFixed(1)} ${w.normal![1]} | p ${w.protan![0].toFixed(1)} | d ${w.deutan![0].toFixed(1)} | t ${w.tritan![0].toFixed(1)} ${w.tritan![1]} ${pass(w) ? 'PASS' : 'fail'}`; };
console.log('== proposals');
for (const c of ['#5E5953', '#182A36', '#24222A', '#2B2620']) console.log(fmt(c));
console.log('== granite search: warm-neutral greys, chroma <= 6');
const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
const greys: string[] = [];
for (let v = 0x20; v <= 0x70; v += 2) for (const [dr, dg, db] of [[4, 2, 0], [3, 2, 0], [2, 1, 0], [0, 0, 0], [2, 1, 4], [0, 1, 3]]) greys.push(hex(v + dr!, v + dg!, v + db!));
const passingGreys = greys.filter((c) => pass(worst(c)));
const lightest = passingGreys.sort((a, b) => labAs(b, 'normal')[0] - labAs(a, 'normal')[0]).slice(0, 6);
for (const c of lightest) console.log(fmt(c));
console.log('== water search: deep blue to blue-green');
const waters: string[] = [];
for (let r = 0x10; r <= 0x30; r += 4) for (let g = 0x18; g <= 0x40; g += 4) for (let b = 0x28; b <= 0x60; b += 4) waters.push(hex(r, g, b));
const passingW = waters.filter((c) => pass(worst(c)));
const bestW = passingW.sort((a, b) => labAs(b, 'normal')[0] - labAs(a, 'normal')[0]).slice(0, 6);
for (const c of bestW) console.log(fmt(c));
console.log('== pairs: lightest passing granite vs best water, all visions');
for (const g of lightest.slice(0, 3)) for (const w of bestW.slice(0, 3)) {
  console.log(g, w, VISIONS.map((v) => `${v[0]} ${deltaE2000(labAs(g, v), labAs(w, v)).toFixed(1)}`).join(' '));
}
