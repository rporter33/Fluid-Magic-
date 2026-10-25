import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
// Can 4 Red-nation and 4 Green-nation banners (first = magic primary) plus independent gray
// all clear 20 normal / 12 CVD for every set that can appear in a 4-nation game?
const fixed = { R1: '#FD6533', G1: '#00674B', ind: '#8C8A80' };
const pairsNeeded = (R: string[], G: string[]) => {
  const p: [string, string][] = [];
  const all = [...R, ...G, fixed.ind];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { p.push([R[i]!, R[j]!]); p.push([G[i]!, G[j]!]); }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i + j + 2 <= 4) p.push([R[i]!, G[j]!]);
  for (const c of [...R, ...G]) p.push([c, fixed.ind]);
  return p;
};
const score = (R: string[], G: string[]) => {
  let worst = Infinity;
  for (const [a, b] of pairsNeeded(R, G)) for (const v of VISIONS) {
    const min = v === 'normal' ? 20 : 12;
    worst = Math.min(worst, deltaE2000(labAs(a, v), labAs(b, v)) / min);
  }
  return worst; // >= 1 means feasible
};
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
const hex = () => '#' + [0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('').toUpperCase();
const jitter = (h: string) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + Math.round((rnd() - 0.5) * 60))).toString(16).padStart(2, '0')).join('').toUpperCase();
let best = { s: -1, R: [] as string[], G: [] as string[] };
for (let restart = 0; restart < 30; restart++) {
  let R = [fixed.R1, hex(), hex(), hex()], G = [fixed.G1, hex(), hex(), hex()];
  let s = score(R, G);
  for (let it = 0; it < 3000; it++) {
    const R2 = [...R], G2 = [...G];
    const k = 1 + Math.floor(rnd() * 3);
    if (rnd() < 0.5) R2[k] = jitter(R2[k]!); else G2[k] = jitter(G2[k]!);
    const s2 = score(R2, G2);
    if (s2 >= s) { R = R2; G = G2; s = s2; }
  }
  if (s > best.s) best = { s, R, G };
}
console.log(best.s.toFixed(3), best.R, best.G);
