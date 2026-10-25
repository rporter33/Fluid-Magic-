// Fog haze ("not yet painted" linen) and mode ghosting: terrain separation under a mix toward
// the linen color, and desaturation for out-of-sight provinces.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hex2(c[0]!)}${hex2(c[1]!)}${hex2(c[2]!)}`;
const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i]! * t));
const desat = (h: string, t: number) => { const c = rgb(h); const y = 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!; return toHex(c.map((v) => v * (1 - t) + y * t)); };
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
function minPair(f: (h: string) => string) {
  return VISIONS.map((v) => { let m = Infinity, p = ''; const n = Object.keys(FILLS); for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) { const d = deltaE2000(labAs(f(FILLS[n[i]!]!), v), labAs(f(FILLS[n[j]!]!), v)); if (d < m) { m = d; p = `${n[i]}/${n[j]}`; } } return `${v} ${m.toFixed(1)} ${p}`; }).join('; ');
}
for (const t of [0.2, 0.3, 0.4, 0.5]) console.log(`linen haze ${t * 100}%: ${minPair((h) => mix(h, '#E8DCC2', t))}`);
for (const t of [0.3, 0.45, 0.6]) console.log(`desaturate ${t * 100}%: ${minPair((h) => desat(h, t))}`);
