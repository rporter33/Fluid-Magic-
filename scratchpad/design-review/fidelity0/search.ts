import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import { COLOR_DEFS, INDEPENDENT_PALETTE } from '/home/user/Fluid-Magic-/src/content/colors.ts';
let s = 12345; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
function hsl(h: number, sat: number, l: number) { const a = sat * Math.min(l, 1 - l); const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return hex(f(0) * 255, f(8) * 255, f(4) * 255); }
const minD = (a: string, b: string) => Math.min(...VISIONS.map((v) => { const d = deltaE2000(labAs(a, v), labAs(b, v)); return v === 'normal' ? d / 20 : d / 12; }));
const gray = INDEPENDENT_PALETTE.primary;
function score(R: string[], G: string[]) {
  let m = Infinity;
  const need: [string, string][] = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { need.push([R[i]!, R[j]!]); need.push([G[i]!, G[j]!]); }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i + j + 2 <= 4) need.push([R[i]!, G[j]!]);
  for (const c of [...R, ...G]) need.push([c, gray]);
  for (const [a, b] of need) m = Math.min(m, minD(a, b));
  return m;
}
let best = -1; let bestSet: [string[], string[]] = [[], []];
for (let t = 0; t < 4000; t++) {
  const R = [COLOR_DEFS.R.palette.primary, ...[1, 2, 3].map(() => hsl(rnd() * 45, 0.5 + rnd() * 0.5, 0.15 + rnd() * 0.75))];
  const G = [COLOR_DEFS.G.palette.primary, ...[1, 2, 3].map(() => hsl(80 + rnd() * 80, 0.4 + rnd() * 0.6, 0.15 + rnd() * 0.75))];
  const sc = score(R, G); if (sc > best) { best = sc; bestSet = [R, G]; }
}
console.log('best min ratio (>=1 means passes 20/12):', best.toFixed(3), bestSet);
// two per color only (common case 2-3 nations)
let best2 = -1; let set2: [string[], string[]] = [[], []];
for (let t = 0; t < 4000; t++) {
  const R = [COLOR_DEFS.R.palette.primary, hsl(rnd() * 45, 0.5 + rnd() * 0.5, 0.15 + rnd() * 0.75)];
  const G = [COLOR_DEFS.G.palette.primary, hsl(80 + rnd() * 80, 0.4 + rnd() * 0.6, 0.15 + rnd() * 0.75)];
  const pairs: [string, string][] = [[R[0]!, R[1]!], [G[0]!, G[1]!], [R[0]!, G[0]!], [R[0]!, G[1]!], [R[1]!, G[0]!], [R[1]!, G[1]!], ...[...R, ...G].map((c) => [c, gray] as [string, string])];
  const sc = Math.min(...pairs.map(([a, b]) => minD(a, b))); if (sc > best2) { best2 = sc; set2 = [R, G]; }
}
console.log('two-per-color best:', best2.toFixed(3), set2);
