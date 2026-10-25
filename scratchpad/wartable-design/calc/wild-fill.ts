// Instrument-first proposal helper: candidate fills for impassable "wilds" against the seven
// terrain fills (palette.test.ts thresholds: CIEDE2000 >= 20 normal, >= 12 under each CVD),
// WCAG contrast for wild labels and chrome material tokens.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const TERRAIN: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const minDE = (c: string, set: Record<string, string>) => VISIONS.map((v) => { let best = 1e9, who = ''; for (const [n, h] of Object.entries(set)) { const d = deltaE2000(labAs(c, v), labAs(h, v)); if (d < best) { best = d; who = n; } } return `${v} ${best.toFixed(1)} (${who})`; }).join(' | ');
const cands = ['#1E1B19', '#24201D', '#2A2522', '#2E2925', '#332D2A', '#3A3530', '#26232A', '#2B2830', '#4A453F', '#E4E1DA', '#F2EFE8'];
console.log('Wild base fill vs terrain fills (min CIEDE2000 per vision; need >=20 normal, >=12 CVD):');
for (const c of cands) console.log(`  ${c}  L*=${labAs(c, 'normal')[0].toFixed(1)}  ${minDE(c, TERRAIN)}`);
console.log('\nTerrain lightness L*:'); for (const [n, h] of Object.entries(TERRAIN)) console.log(`  ${n.padEnd(10)} ${h} L*=${labAs(h, 'normal')[0].toFixed(1)}`);
console.log('\nWild label text and keylines:');
for (const [a, b] of [['#F4EEDF', '#2A2522'], ['#F4EEDF', '#24201D'], ['#C9C1AE', '#2A2522'], ['#E9E4D8', '#2A2522'], ['#8C847A', '#2A2522'], ['#D8CFBE', '#2A2522']]) console.log(`  ${a} on ${b}: ${contrast(a!, b!).toFixed(2)}`);
console.log('\nWild edge vs neighbors: cliff tick #E9E4D8 against each terrain fill (WCAG, non-text needs 3:1 against at least one side):');
for (const [n, h] of Object.entries(TERRAIN)) console.log(`  ${n.padEnd(10)} light tick ${contrast('#E9E4D8', h).toFixed(2)}  dark rim #1C1A17 ${contrast('#1C1A17', h).toFixed(2)}  wild ${contrast('#2A2522', h).toFixed(2)}`);
const chrome: Record<string, string> = { 'chrome-0': '#1C1A17', 'chrome-1': '#26231F', 'chrome-2': '#322E28', 'oak-frame dark #3A2E23': '#3A2E23', 'oak-frame grain light #4A3B2D': '#4A3B2D', 'leather spine #3F2C21': '#3F2C21', 'leather spine #4A3426': '#4A3426', 'parchment #E8DCC2': '#E8DCC2', 'parchment shade #D9CBAE': '#D9CBAE' };
console.log('\nChrome materials: text #F4EEDF / dim (60% on chrome-0 ~ #9F9A8F) / ink #1C1A17:');
for (const [n, h] of Object.entries(chrome)) console.log(`  ${n.padEnd(30)} text ${contrast('#F4EEDF', h).toFixed(2)}  ink ${contrast('#1C1A17', h).toFixed(2)}`);
console.log('\nBrass keylines (non-text, need >=3:1 against the surface):');
for (const b of ['#D4B26A', '#DBBD76', '#C9A55A', '#B8914A', '#9B7E4E']) console.log(`  ${b}  on chrome-0 ${contrast(b, '#1C1A17').toFixed(2)}  on oak-frame #3A2E23 ${contrast(b, '#3A2E23').toFixed(2)}  on chrome-2 ${contrast(b, '#322E28').toFixed(2)}`);
const MANA: Record<string, string> = { 'W prim': '#F3E6B8', 'W sec': '#D9B85C', 'W acc': '#FFFFFF', 'U prim': '#3A7BD5', 'B prim': '#3D2B4F', 'R prim': '#FD6533', 'R acc': '#FFB347', 'G prim': '#00674B', 'G acc': '#A6D96A', 'Indep': '#8C8A80' };
console.log('\nBrass and oak vs mana colors (normal-vision min ΔE):');
for (const b of ['#D4B26A', '#C9A55A', '#B8914A', '#3A2E23', '#E8DCC2', '#2A2522']) console.log(`  ${b}  ${minDE(b, MANA).split(' | ')[0]}`);
