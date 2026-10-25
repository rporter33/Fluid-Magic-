// Research helper: candle colors (Helland approximation), WCAG contrast of candidate
// table/chrome tones, and how a warm candle grade or vignette changes the terrain-fill
// separation that tests/content/palette.test.ts enforces (20 normal, 12 under CVD).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';

const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function kelvin(k: number): string {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return toHex(r, g, b);
}

const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

console.log('Candle / firelight (Helland):');
for (const k of [1500, 1850, 1900, 2000, 2400, 2700, 3000]) console.log(`  ${k}K ${kelvin(k)}`);

const text = '#F4EEDF', ink = '#1C1A17';
const tones: Record<string, string> = {
  'chrome-0 #1C1A17': '#1C1A17', 'chrome-1': '#26231F', 'chrome-2': '#322E28',
  'Light Oak': '#D2B183', 'White Oak': '#CE9F6F', 'French Oak': '#BB9E7C', 'Rich Oak': '#A7855A',
  'Golden Oak': '#A96A28', 'Renwick Golden Oak': '#96724C', 'Library Oak': '#8F7459',
  'Quartersawn Oak': '#85695B', 'Oak Barrel': '#715636', 'Cummings Oak': '#695A45',
  'Oak Plank': '#5D4F39', 'Heritage Oak': '#5C453D', 'Dark Walnut': '#56443E',
  'Black Chestnut Oak': '#252321', 'Leather': '#906A54', 'Saddle Brown': '#8B4513',
  'Brass': '#B5A642', 'Brass Yellow': '#B58735', 'Brass Buttons': '#DFAC4C', 'Brass Nail': '#DBBD76',
  'Bronzed Brass': '#9B7E4E', 'Tarnished Brass': '#7F6C24', 'Antique Brass': '#6C461F',
  'Pewter': '#91A092', 'Aged Pewter': '#889999', 'Pewter Tankard': '#A39B90', 'Burnished Pewter': '#716A62',
  'Dark Pewter': '#606865', 'Parchment (map bg)': '#E8DCC2', 'Candle Glow': '#FFE8C3', 'Beeswax': '#E9D7AB',
};
console.log('\nWCAG contrast: vs --text #F4EEDF | vs ink #1C1A17');
for (const [n, h] of Object.entries(tones)) console.log(`  ${n.padEnd(22)} ${h}  ${contrast(text, h).toFixed(2).padStart(5)} | ${contrast(ink, h).toFixed(2).padStart(5)}`);

const fills: Record<string, string> = {
  Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824',
  Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F',
};
function grade(h: string, tint: string, a: number, dark = 0): string {
  const t = rgb(tint);
  const out = rgb(h).map((c, i) => c * ((1 - a) + a * (t[i]! / 255)) * (1 - dark));
  return toHex(out[0]!, out[1]!, out[2]!);
}
function minPair(f: Record<string, string>) {
  const names = Object.keys(f);
  const res: string[] = [];
  for (const v of VISIONS) {
    let best = Infinity, pair = '';
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const d = deltaE2000(labAs(f[names[i]!]!, v), labAs(f[names[j]!]!, v));
      if (d < best) { best = d; pair = `${names[i]}/${names[j]}`; }
    }
    res.push(`${v} ${best.toFixed(1)} (${pair})`);
  }
  return res.join('; ');
}
console.log('\nTerrain fills, smallest pairwise CIEDE2000 (limits: normal 20, CVD 12):');
console.log(`  baseline: ${minPair(fills)}`);
for (const [k, a] of [[1900, 0.08], [1900, 0.15], [2700, 0.15], [2700, 0.25], [1900, 0.25]] as const) {
  const g: Record<string, string> = {};
  for (const [n, h] of Object.entries(fills)) g[n] = grade(h, kelvin(k), a);
  console.log(`  multiply ${k}K at ${a * 100}%: ${minPair(g)}`);
}
for (const d of [0.15, 0.3]) {
  const g: Record<string, string> = {};
  for (const [n, h] of Object.entries(fills)) g[n] = grade(h, '#FFFFFF', 0, d);
  console.log(`  uniform darkening ${d * 100}% (vignette corner): ${minPair(g)}`);
}
