import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { COLOR_DEFS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors.ts';
let s = 987; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
type C = [number, number, number];
const hex = (c: C) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const fromHex = (h: string): C => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as C;
const minD = (a: string, b: string) => Math.min(...VISIONS.map((v) => { const d = deltaE2000(labAs(a, v), labAs(b, v)); return v === 'normal' ? d / 20 : d / 12; }));
const gray = INDEPENDENT_PALETTE.primary;
function score(R: string[], G: string[]) {
  let m = Infinity;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { m = Math.min(m, minD(R[i]!, R[j]!), minD(G[i]!, G[j]!)); }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i + j + 2 <= 4) m = Math.min(m, minD(R[i]!, G[j]!));
  for (const c of [...R, ...G]) m = Math.min(m, minD(c, gray));
  return m;
}
let overall = -1; let best: string[][] = [];
for (let restart = 0; restart < 15; restart++) {
  let X: C[] = Array.from({ length: 6 }, () => [rnd() * 255, rnd() * 255, rnd() * 255] as C);
  const build = (X: C[]) => [[COLOR_DEFS.R.palette.primary, ...X.slice(0, 3).map(hex)], [COLOR_DEFS.G.palette.primary, ...X.slice(3).map(hex)]];
  let cur = score(...(build(X) as [string[], string[]]));
  for (let it = 0; it < 3000; it++) {
    const Y = X.map((c) => [...c] as C); const k = Math.floor(rnd() * 6); const step = 40 * (1 - it / 3000) + 3;
    Y[k] = Y[k]!.map((x) => Math.max(0, Math.min(255, x + (rnd() - 0.5) * 2 * step))) as C;
    const sc = score(...(build(Y) as [string[], string[]])); if (sc >= cur) { cur = sc; X = Y; }
  }
  if (cur > overall) { overall = cur; best = build(X); }
}
console.log('4-per-color hill climb best ratio:', overall.toFixed(3), best);
