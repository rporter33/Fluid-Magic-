// Color checks for proposal-immersion.md: impassable fills against the terrain fills, dominion
// washes on terrain fills (worst cross pair), and WCAG contrast of the proposed material chrome.
// Uses the repo's tests/content/colorMath.ts (read only), the same math palette.test.ts uses.
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hex2(c[0]!)}${hex2(c[1]!)}${hex2(c[2]!)}`;
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i]! * t));
const over = (fg: string, alpha: number, bg: string) => mix(bg, fg, alpha);
const dE = (a: string, b: string, v: (typeof VISIONS)[number]) => deltaE2000(labAs(a, v), labAs(b, v));

const FILLS: Record<string, string> = {
  Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824',
  Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F',
};

function minAgainst(name: string, hex: string, set: Record<string, string>): string {
  return VISIONS.map((v) => {
    let best = Infinity, who = '';
    for (const [n, h] of Object.entries(set)) { const d = dE(hex, h, v); if (d < best) { best = d; who = n; } }
    return `${v} ${best.toFixed(1)} (${who})`;
  }).join('; ');
}

console.log('== Impassable fills against the terrain fills (need normal >= 20, CVD >= 12)');
const IMP: Record<string, string> = {
  'peak granite #5E5953': '#5E5953', 'peak slate #4F4A45': '#4F4A45', 'peak umber #6A5B4C': '#6A5B4C',
  'peak snowfield #ECE8DF': '#ECE8DF',
  'mere deep #1F3445': '#1F3445', 'mere ink #22303F': '#22303F', 'mere night #182A36': '#182A36',
};
for (const [n, h] of Object.entries(IMP)) console.log(`  ${n.padEnd(26)} ${minAgainst(n, h, FILLS)}`);
for (const v of VISIONS) console.log(`  granite vs mere deep (${v}): ${dE('#5E5953', '#1F3445', v).toFixed(1)}; slate vs mere night: ${dE('#4F4A45', '#182A36', v).toFixed(1)}`);
console.log(`  granite vs sheet #E8DCC2: ${dE('#5E5953', '#E8DCC2', 'normal').toFixed(1)}; contrast text on granite ${cr('#F4EEDF', '#5E5953').toFixed(2)}, on mere deep ${cr('#F4EEDF', '#1F3445').toFixed(2)}`);

console.log('\n== Dominion washes: worst pair of different terrains, either one washed or not (need 20 / 12)');
const WASH: Record<string, string> = { 'Cinder ash #8F8C88': '#8F8C88', 'Cinder char #4A4440': '#4A4440', 'Thornwood verdant #3F7A3A': '#3F7A3A', 'Thornwood moss #5E7F45': '#5E7F45' };
for (const [wn, wh] of Object.entries(WASH)) {
  for (const t of [0.08, 0.12, 0.16, 0.2]) {
    const res = VISIONS.map((v) => {
      let best = Infinity, pair = '';
      const names = Object.keys(FILLS);
      for (const a of names) for (const b of names) {
        if (a === b) continue;
        for (const [ta, tb] of [[0, t], [t, t]] as const) {
          const d = dE(mix(FILLS[a]!, wh, ta), mix(FILLS[b]!, wh, tb), v);
          if (d < best) { best = d; pair = `${a}${ta ? '*' : ''}/${b}${tb ? '*' : ''}`; }
        }
      }
      return `${v} ${best.toFixed(1)} ${pair}`;
    });
    console.log(`  ${wn} at ${(t * 100).toFixed(0)}%: ${res.join('; ')}`);
  }
}

console.log('\n== Material chrome (WCAG: text 4.5, large text and graphics 3)');
const TEXT = '#F4EEDF', INK = '#1C1A17';
const CHROME: Record<string, string> = {
  'wood-0 (top bar, dock frames) #2E2219': '#2E2219',
  'wood-1 (raised rows) #3A2B1F': '#3A2B1F',
  'wood-2 (hover, selected) #4A3727': '#4A3727',
  'leather (dock spine, no text) #5A3A28': '#5A3A28',
  'parchment card #E8DCC2': '#E8DCC2',
  'parchment card shade #DCCDAE': '#DCCDAE',
  'chrome-0 #1C1A17': '#1C1A17',
};
for (const [n, h] of Object.entries(CHROME)) {
  const dim = over(TEXT, 0.6, h);
  const dim70 = over(TEXT, 0.72, h);
  console.log(`  ${n.padEnd(40)} text ${cr(TEXT, h).toFixed(2)} | dim60 ${cr(dim, h).toFixed(2)} | dim72 ${cr(dim70, h).toFixed(2)} | ink ${cr(INK, h).toFixed(2)} | warm #E8A15A ${cr('#E8A15A', h).toFixed(2)} | cool #8DB6C8 ${cr('#8DB6C8', h).toFixed(2)} | brass #DBBD76 ${cr('#DBBD76', h).toFixed(2)}`);
}
console.log('  ink-side tokens on parchment: warm-ink #8A4A12', cr('#8A4A12', '#E8DCC2').toFixed(2), '| cool-ink #2F5D73', cr('#2F5D73', '#E8DCC2').toFixed(2), '| dim ink 70%', cr(over(INK, 0.7, '#E8DCC2'), '#E8DCC2').toFixed(2), '| dim ink 62%', cr(over(INK, 0.62, '#E8DCC2'), '#E8DCC2').toFixed(2));
console.log('  brass keyline #DBBD76 on wood-0', cr('#DBBD76', '#2E2219').toFixed(2), '| aged brass #9B7E4E on wood-0', cr('#9B7E4E', '#2E2219').toFixed(2), '| focus ring text on parchment', cr(TEXT, '#E8DCC2').toFixed(2), '| focus ring ink on parchment', cr(INK, '#E8DCC2').toFixed(2));

console.log('\n== Oak table tones and the sheet edge');
const OAK: Record<string, string> = { 'oak lit #B08A5E': '#B08A5E', 'oak body #8C6A47': '#8C6A47', 'oak shade #5E4630': '#5E4630', 'oak edge #3E2E20': '#3E2E20' };
for (const [n, h] of Object.entries(OAK)) console.log(`  ${n.padEnd(18)} vs sheet #E8DCC2 contrast ${cr(h, '#E8DCC2').toFixed(2)}; dE normal ${dE(h, '#E8DCC2', 'normal').toFixed(1)}; vs Hills fill dE ${dE(h, '#856824', 'normal').toFixed(1)}; vs Wasteland dE ${dE(h, '#AE897F', 'normal').toFixed(1)}`);

console.log('\n== Pewter (independents) vs Independents grey and token rim');
console.log(`  pewter #91A092 vs #8C8A80: ${VISIONS.map((v) => `${v} ${dE('#91A092', '#8C8A80', v).toFixed(1)}`).join(', ')}`);
