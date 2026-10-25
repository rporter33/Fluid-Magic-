// Searches peak and mere base fills that differ from every terrain fill, the sheet and each other
// by CIEDE2000 >= 20 (normal) and >= 12 (protan, deutan, tritan), as palette.test.ts requires of fills.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const FILLS = ['#C1D29F', '#EEBA3A', '#374C2B', '#856824', '#8DA4AD', '#1A727A', '#AE897F'];
const SHEET = '#E8DCC2';
const hex2 = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
const ok = (h: string, others: string[]) => VISIONS.every((v) => others.every((o) => deltaE2000(labAs(h, v), labAs(o, v)) >= (v === 'normal' ? 20 : 12)));
const margin = (h: string, others: string[]) => Math.min(...VISIONS.flatMap((v) => others.map((o) => deltaE2000(labAs(h, v), labAs(o, v)) - (v === 'normal' ? 20 : 12))));
const found: { h: string; m: number; L: number }[] = [];
for (let r = 0; r < 256; r += 8) for (let g = 0; g < 256; g += 8) for (let b = 0; b < 256; b += 8) {
  const h = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  if (ok(h, [...FILLS, SHEET])) found.push({ h, m: margin(h, [...FILLS, SHEET]), L: labAs(h, 'normal')[0] });
}
const sat = (h: string) => { const l = labAs(h, 'normal'); return Math.hypot(l[1], l[2]); };
const greys = found.filter((f) => sat(f.h) < 10).sort((a, b) => b.m - a.m);
console.log('low-chroma candidates (stone, snow), best margin first:');
for (const f of greys.slice(0, 12)) console.log(`  ${f.h} L ${f.L.toFixed(0)} chroma ${sat(f.h).toFixed(1)} margin ${f.m.toFixed(1)}`);
const darkBlue = found.filter((f) => { const l = labAs(f.h, 'normal'); return l[0] < 35 && l[2] < -5; }).sort((a, b) => b.m - a.m);
console.log('dark blue candidates (deep water):');
for (const f of darkBlue.slice(0, 12)) console.log(`  ${f.h} L ${f.L.toFixed(0)} margin ${f.m.toFixed(1)}`);
// best pairs
let best: [string, string, number] | null = null;
for (const p of greys.slice(0, 60)) for (const w of darkBlue.slice(0, 60)) {
  if (!ok(p.h, [w.h])) continue;
  const m = Math.min(p.m, w.m, margin(p.h, [w.h]));
  if (!best || m > best[2]) best = [p.h, w.h, m];
}
console.log('best peak/mere pair:', best);
