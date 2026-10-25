// Pattern-on-base contrast and a weaker base floor for impassable regions (shape carries identity).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const BASES: Record<string, string> = { 'peak granite #5E5953': '#5E5953', 'mere night #182A36': '#182A36' };
for (const [n, h] of Object.entries(BASES)) {
  const floor = VISIONS.map((v) => { let m = Infinity, w = ''; for (const [fn, f] of Object.entries(FILLS)) { const d = deltaE2000(labAs(h, v), labAs(f, v)); if (d < m) { m = d; w = fn; } } return `${v} ${m.toFixed(1)} (${w})`; }).join('; ');
  console.log(`${n}: floor vs fills ${floor}`);
}
console.log('granite vs night water:', VISIONS.map((v) => `${v} ${deltaE2000(labAs('#5E5953', v), labAs('#182A36', v)).toFixed(1)}`).join(', '));
const PAIRS: [string, string, string][] = [
  ['snow highlight #F3F0E8 on granite', '#F3F0E8', '#5E5953'],
  ['shadow hatch #2B2620 on granite', '#2B2620', '#5E5953'],
  ['ripple #8FC3D3 on night water', '#8FC3D3', '#182A36'],
  ['ripple #6FA3B6 on night water', '#6FA3B6', '#182A36'],
  ['ridge rock #B8BFC4 on Forest', '#B8BFC4', '#374C2B'],
  ['ridge rock #B8BFC4 on Hills', '#B8BFC4', '#856824'],
  ['ridge rock #B8BFC4 on Mountains', '#B8BFC4', '#8DA4AD'],
  ['ridge ink #1C1A17 on Mountains', '#1C1A17', '#8DA4AD'],
  ['ridge ink #1C1A17 on Plains', '#1C1A17', '#C1D29F'],
  ['ridge ink #1C1A17 on Forest', '#1C1A17', '#374C2B'],
  ['keyline light #F4EEDF on Forest', '#F4EEDF', '#374C2B'],
];
for (const [n, a, b] of PAIRS) console.log(`${n.padEnd(38)} ${cr(a, b).toFixed(2)}`);
