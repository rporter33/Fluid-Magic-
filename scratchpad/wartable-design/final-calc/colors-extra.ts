import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const wcag = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const dmin = (a: string, b: string) => Math.min(...VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v))));
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
console.log('footpath on Mountains #8DA4AD:');
for (const [c, a] of [['#2B2620', 0.75], ['#2B2620', 0.85], ['#3E3428', 0.8]] as const) console.log(`  ${c}@${a}: ${wcag(mix('#8DA4AD', c, a), '#8DA4AD').toFixed(2)}`);
console.log('fog line art on hazed (6%) fills: dark sepia #3E3428 / pale #E8DCC2, best per fill:');
for (const [n, f] of Object.entries(FILLS)) { const h = mix(f, '#E8DCC2', 0.06); const d = wcag('#3E3428', h), p = wcag('#E8DCC2', h); console.log(`  ${n}: dark ${d.toFixed(2)} pale ${p.toFixed(2)} -> ${d >= p ? 'dark' : 'pale'} ${Math.max(d, p).toFixed(2)}`); }
console.log('frame metals vs mana colors (min over visions):');
const MANA: Record<string, string> = { 'W pri': '#F3E6B8', 'W sec': '#D9B85C', 'U pri': '#3A7BD5', 'U acc': '#9ED8FF', 'B pri': '#3D2B4F', 'B acc': '#9B4DCA', 'R pri': '#FD6533', 'R sec': '#7A1E12', 'R acc': '#FFB347', 'G pri': '#00674B', 'G sec': '#244F22', 'G acc': '#A6D96A' };
for (const m of ['#8C6A47', '#8C6A43', '#B8914A', '#91A092', '#4A4440', '#6B4A2B', '#C9A24E']) { const w = Object.entries(MANA).map(([n, c]) => [n, dmin(m, c)] as const).sort((a, b) => a[1] - b[1]).slice(0, 2); console.log(`  ${m}: ${w.map(([n, d]) => `${n} ${d.toFixed(1)}`).join(', ')}`); }
console.log('table tones vs sheet #E8DCC2 (WCAG):');
for (const c of ['#B08A5E', '#8F7459', '#715636', '#5E4630', '#3E2E20', '#4A4744']) console.log(`  ${c} ${wcag(c, '#E8DCC2').toFixed(2)}`);
console.log('settlement roof inks: 1 px #2B2620 outline on each fill:');
for (const [n, f] of Object.entries(FILLS)) console.log(`  ${n}: ${wcag('#2B2620', f).toFixed(2)}`);
console.log('passable Mountains stamps on #8DA4AD: lit #B4C1C6', wcag('#B4C1C6', '#8DA4AD').toFixed(2), 'shade #6E7F86', wcag('#6E7F86', '#8DA4AD').toFixed(2), 'ink', wcag('#1C1A17', '#8DA4AD').toFixed(2));
console.log('wild label #E9E4D8 on granite #302F32', wcag('#E9E4D8', '#302F32').toFixed(2), 'on water #24222A', wcag('#E9E4D8', '#24222A').toFixed(2));
console.log('dominion chip and candle: unchanged');
