// Run from the repo root: npx tsx <this> <faces.json>. The repo's color math (tests/content/colorMath.ts, src/content/colors.ts), copied
// unchanged into ./repo, on (A) a replica of tests/content/palette.test.ts's terrain and band checks for both palettes, and (B) every color
// the five fixes draw, against its ground and against the reserved or neighboring colors it must not be confused with.
import { readFileSync } from 'node:fs';
import { closestPair, deltaE2000, labAs, VISIONS, type Vision } from './repo/colorMath.ts';
import { contrastRatio, COLORS, keylineFor, NATION_BANNERS } from './repo/colors.ts';
import { NATIONS } from '/home/user/Fluid-Magic-/src/content/nations/index.ts';
import { MAPGEN } from '/home/user/Fluid-Magic-/src/content/mapgen.ts';

const FJ = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const MIN = (v: Vision) => (v === 'normal' ? 20 : 12);
const dE = (a: string, b: string, v: Vision) => deltaE2000(labAs(a, v), labAs(b, v));
const all = (a: string, b: string) => VISIONS.map((v) => dE(a, b, v).toFixed(1)).join(' / ');
const Ls = (h: string) => labAs(h, 'normal')[0];
const say = (s = '') => console.log(s);

// (A) palette.test.ts replica: the terrain fills distinct, the keyline at 3:1, every band readable (the test's banners, then all 11)
const NATION_COLORS = [...new Set(Object.values(NATIONS).map((n) => n.colors[0]))];
const testBanners = Object.fromEntries(NATION_COLORS.flatMap((c) => NATION_BANNERS[c].map((hex, k) => [`${c}${k}`, hex])));
const allBanners = Object.fromEntries(COLORS.flatMap((c) => NATION_BANNERS[c].map((hex, k) => [`${c}${k}`, hex])));
let fails = 0;
for (const pal of ['bright', 'painted'] as const) {
  const fills: Record<string, string> = FJ[pal].fills;
  say(`== ${pal}: ${Object.entries(fills).map(([t, f]) => `${t} ${f}`).join(', ')}`);
  const cp = VISIONS.map((v) => { const r = closestPair(fills, v); const ok = r.deltaE >= MIN(v); if (!ok) fails++; return `${v} ${r.deltaE.toFixed(1)} (${r.a}/${r.b})${ok ? '' : ' FAIL'}`; });
  say(`   terrain fills, closest pair: ${cp.join('; ')}`);
  const kl = Object.entries(fills).map(([t, f]) => { const c = contrastRatio(keylineFor(f), f); if (c < 3) fails++; return `${t} ${c.toFixed(2)}`; });
  say(`   keyline contrast (need 3): ${kl.join(', ')}`);
  for (const [nm, B] of [['test banners (M1 nations, ' + MAPGEN.maxNations + ' max)', testBanners], ['all 11 banners', allBanners]] as const) {
    let direct = 0, outlined = 0, bad = 0; const badL: string[] = [];
    for (const [bn, b] of Object.entries(B)) for (const [t, f] of Object.entries(fills)) {
      const k = keylineFor(f); const d = VISIONS.every((v) => dE(b, f, v) >= MIN(v)); const o = VISIONS.every((v) => dE(k, f, v) >= MIN(v) && dE(k, b, v) >= MIN(v));
      // the test asks per vision: direct or outlined in that vision
      const perV = VISIONS.every((v) => dE(b, f, v) >= MIN(v) || (dE(k, f, v) >= MIN(v) && dE(k, b, v) >= MIN(v)));
      if (!perV) { bad++; badL.push(`${bn}/${t}`); } else if (d) direct++; else outlined++; void o;
    }
    if (bad) fails += bad;
    say(`   band rule, ${nm}: ${direct} direct, ${outlined} need the keyline, ${bad} fail${bad ? ' ' + badL.join(' ') : ''}`);
  }
}
say(`(A) replica of palette.test.ts terrain and band checks: ${fails ? fails + ' FAILURES' : 'all pass'} in both palettes`);
say();

// (B) the colors the fixes draw (Painted draws them; Bright is listed only to compare: it keeps v3's colors)
const row = (label: string, a: string, b: string) => say(`   ${label.padEnd(46)} ${a} on ${b}: WCAG ${contrastRatio(a, b).toFixed(2)}, dL* ${(Ls(a) - Ls(b)).toFixed(1).padStart(5)}, dE ${all(a, b)}`);
for (const pal of ['painted', 'bright'] as const) {
  const P = FJ[pal];
  say(`== ${pal}${pal === 'bright' ? ' (for comparison only: Bright does not draw the fixed colors)' : ''}`);
  say(' fix 1, forest crown lit face (Mid, Near)'); row('as built, fill + 12', P.forestCrown.litBuilt, P.forestCrown.fill); row('fixed, fill + 22', P.forestCrown.litFixed, P.forestCrown.fill); row('crown shade (unchanged)', P.forestCrown.shade, P.forestCrown.fill);
  say(' fix 2, trees on Plains'); row('as built lit (Plains faces)', P.plainsTrees.litBuilt, P.plainsTrees.fill); row('fixed lit (Forest + 20 faces)', P.plainsTrees.litFixed, P.plainsTrees.fill); row('fixed shade', P.plainsTrees.shadeFixed, P.plainsTrees.fill); row('fixed trunk', P.plainsTrees.trunkFixed, P.plainsTrees.fill);
  row('as built lit vs Thornwood meadow dots', P.plainsTrees.litBuilt, P.meadow); row('fixed lit vs Thornwood meadow dots', P.plainsTrees.litFixed, P.meadow);
  say(' fix 3, grass tufts (Mid, Near), composited at their alpha'); row('Plains stipple as built, dark (-8 at .55)', P.grass.plains.stippleDark, P.grass.plains.fill); row('Plains tuft (-20 at .5)', P.grass.plains.tuft, P.grass.plains.fill); row('Hills tuft (+12 at .45)', P.grass.hills.tuft, P.grass.hills.fill); row('Swamp tuft (+14 at .45)', P.grass.swamp.tuft, P.grass.swamp.fill);
  say(' fix 4, passable peaks'); row('as built lit #B4C1C6', P.peaks.litBuilt, P.peaks.fill); row('as built shade #6E7F86', P.peaks.shadeBuilt, P.peaks.fill); row('fixed lit (faces().lit)', P.peaks.litFixed, P.peaks.fill); row('fixed shade (fill - 26, cool)', P.peaks.shadeFixed, P.peaks.fill);
  row('as built lit vs wild lit', P.peaks.litBuilt, P.peaks.wildLit); row('fixed lit vs wild lit', P.peaks.litFixed, P.peaks.wildLit); row('as built shade vs wild shadow', P.peaks.shadeBuilt, P.peaks.wildShade); row('fixed shade vs wild shadow', P.peaks.shadeFixed, P.peaks.wildShade); row('fixed shade vs granite ground', P.peaks.shadeFixed, P.peaks.granite);
  say(' fix 5, water on Mountains'); row('pond (unchanged, H5 pale)', P.water.pond, P.water.fill); row('brook (unchanged)', P.water.brook, P.water.fill); row('bank ink #35535A, solid', P.water.bankInk, P.water.fill);
  row('pond bank as built (.7, 0.8 px)', P.water.pondBankBuilt, P.water.fill); row('pond bank fixed (.9, 1.2 px)', P.water.pondBankFixed, P.water.fill); row('brook upper bank as built (.55, 0.8 px)', P.water.brookUpperBuilt, P.water.fill); row('brook upper bank fixed (.8, 1.1 px)', P.water.brookUpperFixed, P.water.fill);
  row('pond bank fixed vs pond', P.water.pondBankFixed, P.water.pond); row('brook bank fixed vs brook', P.water.brookUpperFixed, P.water.brook);
}
