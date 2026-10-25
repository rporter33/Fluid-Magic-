import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };
const dAll = (a: string, b: string) => VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)));
const L = (h: string) => labAs(h, 'normal')[0];
const RAMPS: Record<string, number[][]> = {
  mockup: [[24, 30, 60], [64, 60, 120], [150, 80, 110], [220, 140, 80], [250, 230, 160]],
  instrumentLift: [[58, 62, 104], [64, 60, 120], [150, 80, 110], [220, 140, 80], [250, 230, 160]],
  final: [[78, 92, 150], [118, 96, 156], [178, 104, 122], [226, 150, 86], [250, 232, 165]],
};
for (const [name, stops] of Object.entries(RAMPS)) {
  const at = (t: number) => { const x = Math.min(0.9999, t) * 4, k = Math.floor(x), f = x - k; const a = stops[k]!, b = stops[k + 1]!; return toHex(a.map((v, j) => v + (b[j]! - v) * f)); };
  const steps5 = [0, 0.25, 0.5, 0.75, 1].map(at);
  let worst = { g: Infinity, gc: Infinity };
  for (let i = 0; i <= 40; i++) for (const g of ['#302F32', '#24222A']) { const d = dAll(g, at(i / 40)); worst.g = Math.min(worst.g, d[0]!); worst.gc = Math.min(worst.gc, ...d.slice(1)); }
  let adj = Infinity; for (let i = 0; i < 4; i++) adj = Math.min(adj, ...dAll(steps5[i]!, steps5[i + 1]!));
  console.log(`${name}: steps ${steps5.join(' ')}; L* ${steps5.map((s) => L(s).toFixed(0)).join('/')}; vs grounds worst normal ${worst.g.toFixed(1)} CVD ${worst.gc.toFixed(1)}; adjacent steps min ${adj.toFixed(1)}`);
}
// lifted mode base per fill
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
for (const [n, f] of Object.entries(FILLS)) { let base = desat(f, 0.8); let k = 0; while (L(base) < 50 && k < 1) { k += 0.01; base = mix(desat(f, 0.8), '#E8DCC2', k); } console.log(`  mode base ${n}: ${base} (L* ${L(base).toFixed(1)}, linen ${(k * 100).toFixed(0)}%)`); }
// M2 banners over lifted bases vs grounds
for (const g of ['#302F32', '#24222A']) { let fails = 0, worst = ''; let wv = Infinity; for (const f of Object.values(FILLS)) { let base = desat(f, 0.8); let k = 0; while (L(base) < 50 && k < 1) { k += 0.01; base = mix(desat(f, 0.8), '#E8DCC2', k); } for (const b of ['#F3E6B8', '#3A7BD5', '#3D2B4F']) for (const a of [0.34, 0.48, 0.6, 0.7]) { const c = mix(base, b, a); const d = dAll(g, c); const m = Math.min(d[0]! / 20, ...d.slice(1).map((x) => x / 12)); if (m < 1) fails++; if (m < wv) { wv = m; worst = `${b}@${a} ${c} ${d.map((x) => x.toFixed(1)).join('/')}`; } } } console.log(`  ${g} vs M2 primaries over lifted bases: ${fails} need the rim; closest ${worst}`); }
