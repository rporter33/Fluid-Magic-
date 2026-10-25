// Region grounds against mode-tinted province fills (UI spec 2.10.2: ~70% over a desaturated fill).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
type V = (typeof VISIONS)[number];
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i]! * t));
const desat = (h: string) => { const [r, g, b] = rgb(h); const y = 0.299 * r! + 0.587 * g! + 0.114 * b!; return toHex([y, y, y]); };
const dE = (a: string, b: string, v: V) => deltaE2000(labAs(a, v), labAs(b, v));
const FILLS = ['#C1D29F', '#EEBA3A', '#374C2B', '#856824', '#8DA4AD', '#1A727A', '#AE897F'];
const BANNERS = ['#FD6533', '#00674B', '#51DDFC', '#3186F2', '#C98BAD', '#5C488E', '#B5D69C', '#8F0F04'];
const grounds: Record<string, string> = { 'INSTR slate #24222A': '#24222A', 'IMM granite #5E5953': '#5E5953', 'IMM mere #182A36': '#182A36' };
// mockup heat ramp first stop [24,30,60] and the lifted [58,62,104]
const ramp: Record<string, string> = { 'heat0 #181E3C': '#181E3C', 'heat0 lifted #3A3E68': '#3A3E68', 'undominated flat #3B3832': '#3B3832' };
for (const [gn, gh] of Object.entries(grounds)) {
  for (const v of VISIONS) {
    let best = Infinity, who = '';
    for (const f of FILLS) for (const b of BANNERS) for (const a of [0.25, 0.4, 0.55, 0.7]) {
      const c = mix(desat(f), b, a); const d = dE(gh, c, v);
      if (d < best) { best = d; who = `${b}@${a} over ${f}`; }
    }
    const r = Object.entries(ramp).map(([n, h]) => `${n} ${dE(gh, h, v).toFixed(1)}`).join(', ');
    console.log(`${gn} ${v}: dominion-tinted min ${best.toFixed(1)} (${who}); ${r}`);
  }
}
