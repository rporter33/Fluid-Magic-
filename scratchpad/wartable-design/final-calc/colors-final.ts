// Color checks for wartable-design/final.md, with the repo's tests/content/colorMath.ts
// (CIEDE2000 under normal vision and Machado 2009 full-severity protan, deutan, tritan).
// Rule (docs/09 "Distinct colors"): 20 normal, 12 under each deficiency.
import { labAs, deltaE2000, VISIONS, type Vision } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const mix = (base: string, over: string, a: number) => toHex(rgb(base).map((v, i) => v * (1 - a) + rgb(over)[i]! * a));
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const wcag = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const dE = (a: string, b: string, v: Vision) => deltaE2000(labAs(a, v), labAs(b, v));
const dAll = (a: string, b: string) => VISIONS.map((v) => dE(a, b, v));
const pass = (d: number[]) => d[0]! >= 20 && d.slice(1).every((x) => x >= 12);
const fmt = (d: number[]) => d.map((x) => x.toFixed(1)).join(' / ');
const Lstar = (h: string) => labAs(h, 'normal')[0];
// desaturate in sRGB toward the luminance-matched grey (what a canvas filter does)
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };

const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const BANNERS: Record<string, string> = {
  'W #F3E6B8': '#F3E6B8', 'U #3A7BD5': '#3A7BD5', 'B #3D2B4F': '#3D2B4F',
  'R1 #FD6533': '#FD6533', 'R2 #51DDFC': '#51DDFC', 'R3 #3186F2': '#3186F2', 'R4 #C98BAD': '#C98BAD',
  'G1 #00674B': '#00674B', 'G2 #5C488E': '#5C488E', 'G3 #B5D69C': '#B5D69C', 'G4 #8F0F04': '#8F0F04',
  'Indep #8C8A80': '#8C8A80',
};
const M1_BANNERS = ['R1 #FD6533', 'R2 #51DDFC', 'R3 #3186F2', 'R4 #C98BAD', 'G1 #00674B', 'G2 #5C488E', 'G3 #B5D69C', 'G4 #8F0F04'];
const MANA: Record<string, string> = {
  'W pri': '#F3E6B8', 'W sec': '#D9B85C', 'W acc': '#FFFFFF', 'U pri': '#3A7BD5', 'U sec': '#1E3F7A', 'U acc': '#9ED8FF',
  'B pri': '#3D2B4F', 'B sec': '#1A1024', 'B acc': '#9B4DCA', 'R pri': '#FD6533', 'R sec': '#7A1E12', 'R acc': '#FFB347',
  'G pri': '#00674B', 'G sec': '#244F22', 'G acc': '#A6D96A',
};
const RIM = '#E9E4D8';
const LINEN0 = '#E8DCC2';
const INK = '#1C1A17';
const GRANITE = process.env.GRANITE ?? '#302F32';
const WATER = process.env.WATER ?? '#24222A';

function worstVs(color: string, set: Record<string, string>) {
  const out = VISIONS.map(() => ({ d: Infinity, who: '' }));
  for (const [name, c] of Object.entries(set)) VISIONS.forEach((v, k) => { const d = dE(color, c, v); if (d < out[k]!.d) out[k] = { d, who: name }; });
  return out;
}
const line = (label: string, w: { d: number; who: string }[]) => `${label}: ${w.map((x, k) => `${VISIONS[k]} ${x.d.toFixed(1)} (${x.who})`).join(' | ')} ${w[0]!.d >= 20 && w.slice(1).every((x) => x.d >= 12) ? 'PASS' : 'fail'}`;

console.log('== A. Impassable grounds against the seven terrain fills (20 / 12)');
for (const [n, g] of [['granite (peaks)', GRANITE], ['water (meres)', WATER]] as const) console.log(`  ${n} ${g} L* ${Lstar(g).toFixed(1)}  ${line('', worstVs(g, FILLS))}`);
console.log(`  granite vs water: ${fmt(dAll(GRANITE, WATER))} (never adjacent: ranges are 3 cells apart; kind is carried by stamp shape)`);

console.log('\n== B. Grounds against every banner (the band rule: pass, or the rim differs from both)');
for (const [n, g] of [['granite', GRANITE], ['water', WATER]] as const) {
  for (const [bn, b] of Object.entries(BANNERS)) {
    const direct = dAll(g, b), rimB = dAll(RIM, b), rimG = dAll(RIM, g);
    const ok = pass(direct) ? 'direct' : pass(rimB) && pass(rimG) ? 'via rim' : 'FAIL';
    if (ok !== 'direct') console.log(`  ${n} vs ${bn}: ${fmt(direct)} -> ${ok} (rim vs banner ${fmt(rimB)}, rim vs ground ${fmt(rimG)})`);
  }
  console.log(`  ${n}: every other banner passes directly`);
}

console.log('\n== C. Rim and marks: WCAG contrast');
console.log(`  rim ${RIM} on granite ${wcag(RIM, GRANITE).toFixed(2)}, on water ${wcag(RIM, WATER).toFixed(2)}; ink ${INK} on granite ${wcag(INK, GRANITE).toFixed(2)}`);
for (const [n, f] of Object.entries(FILLS)) console.log(`  edge vs ${n}: granite ${wcag(GRANITE, f).toFixed(2)}, water ${wcag(WATER, f).toFixed(2)}, rim ${wcag(RIM, f).toFixed(2)} -> best ${Math.max(wcag(GRANITE, f), wcag(RIM, f)).toFixed(2)}`);
for (const [n, c, bg] of [['ripple #8FC3D3 on water', '#8FC3D3', WATER], ['snow #F2EEE6 on granite', '#F2EEE6', GRANITE], ['lit rock #8A857E on granite', '#8A857E', GRANITE], ['label #E9E4D8 on water', RIM, WATER], ['footpath #5E5246 @60% on Mountains', mix('#8DA4AD', '#5E5246', 0.6), '#8DA4AD'], ['footpath #3E3428 @70% on Mountains', mix('#8DA4AD', '#3E3428', 0.7), '#8DA4AD']] as const) console.log(`  ${n}: ${wcag(c, bg).toFixed(2)}`);

console.log(`\n== D. Grounds against map-mode fills (tint over the terrain fill desaturated 80%${process.env.NOLIFT ? '' : ', lifted to L* 50'}; ramp ${process.env.NOLIFT ? 'instrument lift' : 'final'})`);
const DOM_ALPHA = [0.34, 0.48, 0.6, 0.7];
const modeFills: Record<string, string> = {};
const liftTo50 = (f: string) => { let base = desat(f, 0.8); let k = 0; while (Lstar(base) < 50 && k < 1) { k += 0.01; base = mix(desat(f, 0.8), LINEN0, k); } return base; };
for (const [fn, f] of Object.entries(FILLS)) {
  const base = process.env.NOLIFT ? desat(f, 0.8) : liftTo50(f);
  modeFills[`undominated ${fn}`] = base;
  for (const bn of Object.keys(BANNERS)) if (bn !== 'Indep #8C8A80') DOM_ALPHA.forEach((a) => (modeFills[`${bn}@${a} over ${fn}`] = mix(base, BANNERS[bn]!, a)));
}
const heatStops = process.env.NOLIFT ? [[58, 62, 104], [64, 60, 120], [150, 80, 110], [220, 140, 80], [250, 230, 160]] : [[0x4C, 0x5E, 0x96], [0x81, 0x70, 0xAC], [0xC4, 0x80, 0x8E], [0xE6, 0xAC, 0x6E], [0xF8, 0xE6, 0xA6]];
const heat = (t: number) => { const x = Math.min(0.9999, t) * 4, k = Math.floor(x), f = x - k; const a = heatStops[k]!, b = heatStops[k + 1]!; return toHex(a.map((v, j) => v + (b[j]! - v) * f)); };
for (let i = 0; i <= 20; i++) modeFills[`ramp t=${(i / 20).toFixed(2)}`] = heat(i / 20);
const minL = Math.min(...Object.entries(modeFills).filter(([k]) => k.startsWith('ramp')).map(([, c]) => Lstar(c)));
console.log(`  ramp lowest L* ${minL.toFixed(1)}; the mockup's old first stop #181E3C L* ${Lstar('#181E3C').toFixed(1)}`);
for (const [n, g] of [['granite', GRANITE], ['water', WATER]] as const) {
  let direct = 0, viaRim = 0; const fails: string[] = []; const m1fails: string[] = [];
  let worst = { d: Infinity, who: '' };
  for (const [mn, c] of Object.entries(modeFills)) {
    const d = dAll(g, c);
    const m = Math.min(d[0]! / 20, ...d.slice(1).map((x) => x / 12));
    if (m < worst.d) worst = { d: m, who: `${mn} ${c} ${fmt(d)}` };
    if (pass(d)) { direct++; continue; }
    if (pass(dAll(RIM, c)) && pass(dAll(RIM, g))) { viaRim++; if (!/^(W|U|B) /.test(mn)) m1fails.push(mn); continue; }
    fails.push(`${mn} ${fmt(d)}`);
  }
  console.log(`  ${n}: ${Object.keys(modeFills).length} mode fills; direct ${direct}; via rim ${viaRim} (of which M1 banners or ramp: ${m1fails.length}); FAIL ${fails.length}`);
  console.log(`    closest (as a fraction of the threshold): ${worst.who}`);
  if (m1fails.length) console.log(`    M1 cases needing the rim: ${m1fails.slice(0, 12).join('; ')}${m1fails.length > 12 ? ' ...' : ''}`);
  if (fails.length) console.log(`    fails: ${fails.slice(0, 8).join('; ')}`);
}

console.log('\n== E. Land-look washes (no light on the sheet): every pair type');
const LOOKS = { Cinder: '#8F8C88', Thornwood: '#5E7F45' };
function washWorst(cw: number, tw: number) {
  const looks = [(f: string) => f, (f: string) => mix(f, LOOKS.Cinder, cw), (f: string) => mix(f, LOOKS.Thornwood, tw)];
  let n = Infinity, cvd = Infinity; let who = '';
  const fl = Object.entries(FILLS);
  for (const [an, a] of fl) for (const [bn, b] of fl) if (an !== bn) for (const la of looks) for (const lb of looks) VISIONS.forEach((v) => {
    const d = dE(la(a), lb(b), v);
    if (v === 'normal') n = Math.min(n, d); else if (d < cvd) { cvd = d; who = `${an}/${bn} ${v}`; }
  });
  return { n, cvd, who };
}
for (const [c, t] of [[0.12, 0.08], [0.1, 0.06], [0.08, 0.05]] as const) { const w = washWorst(c, t); console.log(`  Cinder ${c}, Thornwood ${t}: worst normal ${w.n.toFixed(1)}, worst CVD ${w.cvd.toFixed(1)} (${w.who}) ${w.n >= 20 && w.cvd >= 12 ? 'PASS' : 'fail'}`); }
for (const [n, g] of [['granite', GRANITE], ['water', WATER]] as const) {
  const washed: Record<string, string> = {};
  for (const [fn, f] of Object.entries(FILLS)) { washed[`${fn}+ash10`] = mix(f, LOOKS.Cinder, 0.1); washed[`${fn}+moss6`] = mix(f, LOOKS.Thornwood, 0.06); }
  console.log(`  ${n} vs washed fills: ${line('', worstVs(g, washed))}`);
}

console.log('\n== F. Fog: largest linen haze and desaturation that keep every terrain pair at 20 / 12');
const LINEN = '#E8DCC2';
function fogWorst(f: (h: string) => string) {
  let n = Infinity, cvd = Infinity; let who = '';
  const fl = Object.entries(FILLS);
  for (const [an, a] of fl) for (const [bn, b] of fl) if (an !== bn) for (const [xa, xb] of [[f(a), f(b)], [f(a), b]]) VISIONS.forEach((v) => {
    const d = dE(xa!, xb!, v);
    if (v === 'normal') { if (d < n) n = d; } else if (d < cvd) { cvd = d; who = `${an}/${bn} ${v}`; }
  });
  return { n, cvd, who };
}
for (const a of [0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.35]) { const w = fogWorst((h) => mix(h, LINEN, a)); console.log(`  haze ${a}: normal ${w.n.toFixed(1)}, CVD ${w.cvd.toFixed(1)} (${w.who}) ${w.n >= 20 && w.cvd >= 12 ? 'PASS' : 'fail'}`); }
for (const d of [0.1, 0.15, 0.2, 0.25, 0.3, 0.45]) { const w = fogWorst((h) => desat(h, d)); console.log(`  desaturate ${d}: normal ${w.n.toFixed(1)}, CVD ${w.cvd.toFixed(1)} (${w.who}) ${w.n >= 20 && w.cvd >= 12 ? 'PASS' : 'fail'}`); }

console.log('\n== G. Brass and gilt against the mana colors (min over visions; the rule for hardware: >= 10, and never touching a symbol)');
for (const b of ['#B8914A', '#D4B26A', '#DBBD76', '#8C6A43', '#91A092']) {
  const w = Object.entries(MANA).map(([n, c]) => ({ n, d: Math.min(...dAll(b, c)) })).sort((x, y) => x.d - y.d).slice(0, 3);
  console.log(`  ${b}: closest ${w.map((x) => `${x.n} ${x.d.toFixed(1)}`).join(', ')}`);
}

console.log('\n== H. Chrome: staged tokens against the immersion warm retune (WCAG; text 4.5, non-text 3.0)');
const CHROME = { staged: ['#1C1A17', '#26231F', '#322E28'], warm: ['#2E2219', '#3A2B1F', '#4A3727'] };
const ALERTS = { urgent: '#D9493B', important: '#E2B843', opportunity: '#61AF6C', hint: '#4D8FD3' };
const TEXT = { text: '#F4EEDF', dim: mix('#1C1A17', '#F4EEDF', 0.6), warm: '#E8A15A', cool: '#8DB6C8' };
for (const [set, tones] of Object.entries(CHROME)) {
  for (const [i, bg] of tones.entries()) {
    const dimOn = mix(bg, '#F4EEDF', 0.6);
    const a = Object.entries(ALERTS).map(([n, c]) => `${n} ${wcag(c, bg).toFixed(2)}`).join(', ');
    const m = Object.entries(MANA).filter(([n]) => n.endsWith('pri')).map(([n, c]) => `${n[0]} ${wcag(c, bg).toFixed(2)}`).join(' ');
    const lowBanners = Object.entries(BANNERS).filter(([, c]) => wcag(c, bg) < 3).map(([n, c]) => `${n.split(' ')[0]} ${wcag(c, bg).toFixed(2)}`).join(', ');
    console.log(`  ${set} chrome-${i} ${bg}: text ${wcag(TEXT.text, bg).toFixed(2)} dim ${wcag(dimOn, bg).toFixed(2)} warm ${wcag(TEXT.warm, bg).toFixed(2)} cool ${wcag(TEXT.cool, bg).toFixed(2)} brass ${wcag('#B8914A', bg).toFixed(2)}`);
    console.log(`     alerts: ${a}`);
    console.log(`     mana primaries: ${m}`);
    console.log(`     banners under 3:1: ${lowBanners || 'none'}`);
  }
}

console.log('\n== I. Oak, sheet, parchment');
const OAK = { lit: '#B08A5E', body: '#8F7459', shade: '#5E4630', edge: '#3E2E20', iron: '#4A4744' };
for (const [n, c] of Object.entries(OAK)) console.log(`  oak ${n} ${c} vs sheet ${LINEN}: WCAG ${wcag(c, LINEN).toFixed(2)}, dE ${fmt(dAll(c, LINEN))}; vs Ember primary dE ${Math.min(...dAll(c, '#FD6533')).toFixed(1)}; vs Hills ${Math.min(...dAll(c, '#856824')).toFixed(1)}`);
const PARCH = '#E8DCC2';
for (const [n, c] of [['ink', INK], ['dim ink 70%', mix(PARCH, INK, 0.7)], ['warm-ink #8A4A12', '#8A4A12'], ['cool-ink #2F5D73', '#2F5D73']] as const) console.log(`  ${n} on parchment: ${wcag(c, PARCH).toFixed(2)}`);
console.log(`  W primary on parchment: ${wcag('#F3E6B8', PARCH).toFixed(2)} (needs the ink ring)`);
