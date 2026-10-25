// Judge 2 independent checks (read-only use of the repo's colorMath).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
type V = (typeof VISIONS)[number];
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i]! * t));
const multiply = (a: string, tint: string, s: number) => toHex(rgb(a).map((v, i) => v * (1 - s + s * rgb(tint)[i]! / 255)));
const dE = (a: string, b: string, v: V) => deltaE2000(labAs(a, v), labAs(b, v));
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const TEXT = '#F4EEDF';
const dim = (bg: string) => mix(bg, TEXT, 0.6);

console.log('== WCAG text contrast on proposed surfaces (AA 4.5 text, 3.0 non-text)');
const surf: Record<string, string> = {
  'staged chrome-0 #1C1A17': '#1C1A17', 'staged chrome-1 #26231F': '#26231F', 'staged chrome-2 #322E28': '#322E28',
  'INSTR oak-0 #2B231C': '#2B231C', 'INSTR oak-grain #3A2E23': '#3A2E23', 'INSTR leather #4A3426': '#4A3426',
  'IMM chrome-0 #2E2219': '#2E2219', 'IMM chrome-1 #3A2B1F': '#3A2B1F', 'IMM chrome-2 #4A3727': '#4A3727', 'IMM leather #5A3A28': '#5A3A28',
};
for (const [n, h] of Object.entries(surf)) {
  console.log(`  ${n.padEnd(28)} text ${cr(TEXT, h).toFixed(2)} dim60 ${cr(dim(h), h).toFixed(2)} warm ${cr('#E8A15A', h).toFixed(2)} cool ${cr('#8DB6C8', h).toFixed(2)} brassI #B8914A ${cr('#B8914A', h).toFixed(2)} brassM #DBBD76 ${cr('#DBBD76', h).toFixed(2)} keyline25% ${cr(mix(h, TEXT, 0.25), h).toFixed(2)}`);
}
// IMM: action button = chrome-2 fill inside chrome-0/1 panel; staged keyline is text at 25% (non-text 3:1?)
console.log('  staged keyline (text@25%) on staged chrome-2:', cr(mix('#322E28', TEXT, 0.25), '#322E28').toFixed(2));
console.log('  IMM chrome-1 vs chrome-0 step', cr('#3A2B1F', '#2E2219').toFixed(2), '| chrome-2 vs chrome-1', cr('#4A3727', '#3A2B1F').toFixed(2), '| staged 1 vs 0', cr('#26231F', '#1C1A17').toFixed(2), '| staged 2 vs 1', cr('#322E28', '#26231F').toFixed(2));
console.log('  parchment: ink', cr('#1C1A17', '#E8DCC2').toFixed(2), '| W primary #F3E6B8 on parchment', cr('#F3E6B8', '#E8DCC2').toFixed(2), 'dE', dE('#F3E6B8', '#E8DCC2', 'normal').toFixed(1));
console.log('  Ember secondary header #7A1E12 text on it', cr(TEXT, '#7A1E12').toFixed(2), '| Loam secondary #244F22', cr(TEXT, '#244F22').toFixed(2));

console.log('\n== Brass vs mana palette (W sec #D9B85C, W pri #F3E6B8, R accent #FFB347, R pri #FD6533)');
for (const b of ['#B8914A', '#DBBD76', '#D4B26A', '#F2D27A', '#B58735']) {
  for (const [mn, mh] of [['Wsec', '#D9B85C'], ['Wpri', '#F3E6B8'], ['Racc', '#FFB347'], ['Rpri', '#FD6533']] as const) {
    console.log(`  ${b} vs ${mn}: ${VISIONS.map((v) => `${v[0]} ${dE(b, mh, v).toFixed(1)}`).join(' ')}`);
  }
}

console.log('\n== Region grounds vs fills and vs mana/banners (rule: 20 normal / 12 CVD)');
const grounds: Record<string, string> = { 'INSTR slate #24222A': '#24222A', 'IMM granite #5E5953': '#5E5953', 'IMM mere #182A36': '#182A36' };
const others: Record<string, string> = { ...FILLS, 'B pri #3D2B4F': '#3D2B4F', 'B sec #1A1024': '#1A1024', 'U sec #1E3F7A': '#1E3F7A', 'G pri #00674B': '#00674B', 'R sec #7A1E12': '#7A1E12', 'banner #5C488E': '#5C488E', 'Indep #4A4A44': '#4A4A44', 'border #2B2620': '#2B2620' };
for (const [gn, gh] of Object.entries(grounds)) {
  for (const v of VISIONS) {
    const rows = Object.entries(others).map(([n, h]) => [n, dE(gh, h, v)] as const).sort((a, b) => a[1] - b[1]).slice(0, 3);
    console.log(`  ${gn} ${v}: ${rows.map(([n, d]) => `${n} ${d.toFixed(1)}`).join(', ')}`);
  }
}
console.log('  slate vs border #2B2620 contrast', cr('#24222A', '#2B2620').toFixed(2));

console.log('\n== IMM: dominion wash at washMax plus the 8% 2700K multiply (#FFA757) on the cloth');
const WASHES: Record<string, [string, number]> = { Cinder: ['#8F8C88', 0.12], Thornwood: ['#5E7F45', 0.08] };
for (const [wn, [wh, wa]] of Object.entries(WASHES)) {
  for (const v of VISIONS) {
    let best = Infinity, pair = '';
    const names = Object.keys(FILLS);
    for (const a of names) for (const b of names) {
      if (a === b) continue;
      for (const [ta, tb] of [[0, wa], [wa, wa]] as const)
        for (const [ma, mb] of [[0, 0.08], [0.08, 0.08], [0.08, 0]] as const) {
          const ca = multiply(mix(FILLS[a]!, wh, ta), '#FFA757', ma);
          const cb = multiply(mix(FILLS[b]!, wh, tb), '#FFA757', mb);
          const d = dE(ca, cb, v);
          if (d < best) { best = d; pair = `${a}${ta ? '*' : ''}${ma ? 'L' : ''}/${b}${tb ? '*' : ''}${mb ? 'L' : ''}`; }
        }
    }
    console.log(`  ${wn} wash ${wa} + light: ${v} ${best.toFixed(1)} ${pair}`);
  }
}
for (const v of VISIONS) {
  let best = Infinity, pair = '';
  const names = Object.keys(FILLS);
  for (const a of names) for (const b of names) { if (a === b) continue; const d = dE(multiply(FILLS[a]!, '#FFA757', 0.08), FILLS[b]!, v); if (d < best) { best = d; pair = `${a}L/${b}`; } }
  console.log(`  light alone (one lit, one not): ${v} ${best.toFixed(1)} ${pair}`);
}
// Cross-nation: one province with Cinder wash, another with Thornwood wash
for (const v of VISIONS) {
  let best = Infinity, pair = '';
  const names = Object.keys(FILLS);
  for (const a of names) for (const b of names) { if (a === b) continue; const d = dE(mix(FILLS[a]!, '#8F8C88', 0.12), mix(FILLS[b]!, '#5E7F45', 0.08), v); if (d < best) { best = d; pair = `${a}C/${b}T`; } }
  console.log(`  Cinder-washed vs Thornwood-washed: ${v} ${best.toFixed(1)} ${pair}`);
}

console.log('\n== Bake memory (RGBA8) for Large, 4 nations');
// provinceCount: large 80 + 25 * 2 = 130; mapDimensions keeps 6400/cell, aspect 1.6
for (const [label, cells] of [['Medium 2n IMM 65', 65], ['Medium 2n INSTR 66', 66], ['Large 4n IMM 139', 139], ['Large 4n INSTR 144', 144]] as const) {
  const area = cells * 6400; const w = Math.sqrt(area * 1.6); const h = area / w;
  const mb = (s: number) => ((w * s) * (h * s) * 4 / 2 ** 20).toFixed(1);
  console.log(`  ${label}: ${w.toFixed(0)} x ${h.toFixed(0)} units; IMM Far 0.6 ${mb(1.2)} MB, Mid 1.2 ${mb(2.4)} MB, Near 2.4 ${mb(4.8)} MB at DPR2; INSTR Mid 1.25 ${mb(2.5)} MB at DPR2`);
}
