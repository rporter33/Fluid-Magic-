// Mirror of src/sim/pretender.ts designCost with the final rules (final.md A.3): per-chassis first pip of a
// new color (D2), attunement (D3), boons (A.7). Prints every preset and example build, and the parity table.
const PIP = [40, 20, 25, 30, 35, 40], DOM = 30, OWN = 20, OTHER = 40, BUDGET = 400;
const REFUND = { awake: 0, dormant: 150, imprisoned: 350 };
const POLE = { order: { pos: 'W', neg: 'R' }, lore: { pos: 'U', neg: 'R' }, growth: { pos: 'G', neg: 'B' }, wild: { pos: 'G', neg: 'U' }, sanctity: { pos: 'W', neg: 'B' } };
// id: [cost, basePips, baseDominion, newColorFirstPip, pipDiscount, minAwakening, attunement, springs, builtInBoon, realm]
export const C = {
  oracle: [20, null, 1, 40, 10, null, [], 0, null, 'generic'],
  titan: [120, ['nation', 1], 2, 60, 0, null, [], 0, null, 'generic'],
  greatWyrm: [220, ['nation', 2], 2, 80, 0, null, [], 0, null, 'generic'],
  livingMonolith: [60, null, 4, 50, 0, null, [], 0, null, 'generic'],
  ascendedHero: [100, ['nation', 1], 1, 50, 0, null, [], 0, 'avatar', 'generic'],
  primordial: [220, ['nation', 2], 3, 80, 0, 'dormant', [], 0, null, 'generic'],
  ashColossus: [100, ['R', 1], 1, 60, 0, null, [], 0, null, 'R'],
  ashPhoenix: [120, ['R', 1], 2, 80, 0, null, [['growth', 1]], 0, null, 'R'],
  pyreLord: [140, ['R', 2], 2, 60, 0, null, [], 0, null, 'R'],
  cinderIdol: [110, ['R', 2], 4, 50, 0, null, [['sanctity', -1]], 0, null, 'R'],
  emberHierophant: [60, ['R', 2], 1, 40, 0, null, [], 0, null, 'R'],
  wildSpirit: [80, ['G', 1], 2, 80, 0, null, [], 0, null, 'G'],
  worldTree: [150, ['G', 2], 4, 50, 0, null, [['sanctity', 1]], 1, null, 'G'],
  hornedHunter: [140, ['G', 2], 2, 60, 0, null, [['lore', -1]], 0, null, 'G'],
  elderWyrm: [190, ['G', 1], 2, 80, 0, null, [], 0, null, 'G'],
  motherOfBeasts: [130, ['G', 1], 2, 60, 0, null, [], 0, null, 'G'],
};
const BOON = { sacredSpring: 40, avatar: 40 };
export function cost(nation, d) {
  const [ccost, base, bdom, newColor, disc, minAw, att, , builtIn, realm] = C[d.chassis];
  const free = {}; if (base) free[base[0] === 'nation' ? nation : base[0]] = base[1];
  let t = ccost; const parts = { chassis: ccost, pips: 0, dominion: 0, scales: 0, boons: 0 };
  for (const [c, n] of Object.entries(d.pips)) for (let l = (free[c] ?? 0) + 1; l <= n; l++) {
    const p = (l === 1 && c !== nation ? newColor : PIP[l - 1]) - disc; t += p; parts.pips += p; }
  const dp = Math.max(0, d.dominion - bdom) * DOM; t += dp; parts.dominion = dp;
  for (const [ax, v] of Object.entries(d.scales ?? {})) { if (!v) continue; const pole = v > 0 ? POLE[ax].pos : POLE[ax].neg;
    const attuned = att.some(([a, s]) => a === ax && Math.sign(s) === Math.sign(v));
    const s = Math.abs(v) * (pole === nation || attuned ? OWN : OTHER); t += s; parts.scales += s; }
  for (const b of d.boons ?? []) { if (b === builtIn) return { t: NaN, ok: false, why: 'built in' }; t += BOON[b]; parts.boons += BOON[b]; }
  const budget = BUDGET + REFUND[d.awakening];
  const minOk = !minAw || d.awakening !== 'awake';
  const realmOk = realm === 'generic' || realm === nation;
  const bp = Object.fromEntries(Object.entries(d.pips).map(([c, n]) => [c, Math.max(0, n - 1)]));
  return { t, budget, ok: t <= budget && minOk && realmOk, parts, bp };
}
const R = 'R', G = 'G';
export const PRESETS = [
  ['Warlord (default, unchanged)', R, { chassis: 'titan', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -2 }, awakening: 'awake' }],
  ['Ember Oracle (unchanged)', R, { chassis: 'oracle', pips: { R: 6 }, dominion: 4, scales: { lore: -2 }, awakening: 'dormant' }],
  ['Wildfire (unchanged)', R, { chassis: 'ashColossus', pips: { R: 3 }, dominion: 6, scales: { order: -3, lore: -3 }, awakening: 'imprisoned' }],
  ['Undying Flame', R, { chassis: 'ashPhoenix', pips: { R: 4 }, dominion: 5, scales: { growth: 2, lore: -2, order: -1 }, awakening: 'awake' }],
  ['Pyre Host', R, { chassis: 'pyreLord', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -2 }, awakening: 'awake' }],
  ['Dread Idol', R, { chassis: 'cinderIdol', pips: { R: 4 }, dominion: 9, scales: { sanctity: -3, order: -1 }, awakening: 'awake' }],
  ['Elder Oak (default, unchanged)', G, { chassis: 'titan', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, awakening: 'awake' }],
  ['Deep Root (unchanged)', G, { chassis: 'livingMonolith', pips: { G: 3 }, dominion: 7, scales: { growth: 3, wild: 3, sanctity: 1 }, awakening: 'awake' }],
  ['Wyrm of the Loam (unchanged)', G, { chassis: 'greatWyrm', pips: { G: 4 }, dominion: 4, scales: { growth: 2 }, awakening: 'dormant' }],
  ['Heartwood', G, { chassis: 'worldTree', pips: { G: 4 }, dominion: 7, scales: { growth: 3, wild: 1, sanctity: 1 }, awakening: 'awake' }],
  ['Hunt Lord', G, { chassis: 'hornedHunter', pips: { G: 4 }, dominion: 4, scales: { lore: -2, wild: 2, growth: 3 }, awakening: 'awake' }],
  ['Mother of the Pack', G, { chassis: 'motherOfBeasts', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, awakening: 'awake' }],
];
export const EXAMPLES = [
  ['Oracle mage god', R, { chassis: 'oracle', pips: { R: 6, G: 3 }, dominion: 8, scales: { lore: 2 }, awakening: 'dormant' }],
  ['Titan general', R, { chassis: 'titan', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -2 }, awakening: 'awake' }],
  ['Great Wyrm awake', R, { chassis: 'greatWyrm', pips: { R: 4 }, dominion: 5, scales: { lore: -1 }, awakening: 'awake' }],
  ['Monolith dominion 10', G, { chassis: 'livingMonolith', pips: { G: 2 }, dominion: 10, scales: { growth: 2 }, awakening: 'awake' }],
  ['Ascended Hero bless rush', R, { chassis: 'ascendedHero', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -2 }, awakening: 'awake' }],
  ['Primordial sleeper', R, { chassis: 'primordial', pips: { R: 4 }, dominion: 6, scales: { lore: -3, order: -3, growth: 1 }, awakening: 'dormant' }],
  ['Ash Colossus brawler', R, { chassis: 'ashColossus', pips: { R: 4 }, dominion: 4, scales: { lore: -3, order: -1 }, boons: ['avatar'], awakening: 'awake' }],
  ['Ash Phoenix raider', R, { chassis: 'ashPhoenix', pips: { R: 4 }, dominion: 5, scales: { growth: 2, lore: -2, order: -1 }, awakening: 'awake' }],
  ['Pyre Lord', R, { chassis: 'pyreLord', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -2 }, awakening: 'awake' }],
  ['Cinder Idol', R, { chassis: 'cinderIdol', pips: { R: 4 }, dominion: 9, scales: { sanctity: -3, order: -1 }, awakening: 'awake' }],
  ['Ember Hierophant battle mage', R, { chassis: 'emberHierophant', pips: { R: 6 }, dominion: 4, scales: { lore: -3, order: -1 }, awakening: 'awake' }],
  ['Wild Spirit with Avatar', G, { chassis: 'wildSpirit', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, boons: ['avatar'], awakening: 'awake' }],
  ['World Tree', G, { chassis: 'worldTree', pips: { G: 4 }, dominion: 7, scales: { growth: 3, wild: 1, sanctity: 1 }, awakening: 'awake' }],
  ['Horned Hunter', G, { chassis: 'hornedHunter', pips: { G: 4 }, dominion: 4, scales: { lore: -2, wild: 2, growth: 3 }, awakening: 'awake' }],
  ['Elder Wyrm awake', G, { chassis: 'elderWyrm', pips: { G: 4 }, dominion: 4, scales: { growth: 2, wild: 1 }, awakening: 'awake' }],
  ['Ascended Hero, Thornwood double bless', G, { chassis: 'ascendedHero', pips: { G: 6 }, dominion: 3, scales: { growth: 2, wild: 1 }, awakening: 'awake' }],
  ['Mother of Beasts', G, { chassis: 'motherOfBeasts', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, awakening: 'awake' }],
  ['Refused: Pyre Lord for Thornwood', G, { chassis: 'pyreLord', pips: { R: 2 }, dominion: 2, scales: {}, awakening: 'awake' }],
  ['Refused: awake Primordial', G, { chassis: 'primordial', pips: { G: 2 }, dominion: 3, scales: {}, awakening: 'awake' }],
];
if (process.argv[1].endsWith('costs-final.mjs')) {
  console.log('| Preset or build | Nation | Cost / budget | chassis / pips / dominion / scales / boons | bless points | valid |');
  console.log('|---|---|---|---|---|---|');
  for (const [name, n, d] of [...PRESETS, ...EXAMPLES]) { const r = cost(n, d); const p = r.parts ?? {};
    console.log(`| ${name} | ${n} | ${r.t} / ${r.budget} | ${p.chassis} / ${p.pips} / ${p.dominion} / ${p.scales} / ${p.boons} | ${JSON.stringify(r.bp)} | ${r.ok ? 'yes' : 'no'} |`); }
  console.log('\n| Chassis | Cost | Base pips (value) | Base dominion over 1 (value) | Built in (value) | Body value |');
  console.log('|---|---|---|---|---|---|');
  for (const [id, [cc, base, bdom, , , , , springs, builtIn]] of Object.entries(C)) {
    const pv = base ? PIP.slice(0, base[1]).reduce((a, b) => a + b, 0) : 0; const dv = (bdom - 1) * DOM; const bv = (builtIn ? BOON[builtIn] : 0) + springs * BOON.sacredSpring;
    console.log(`| ${id} | ${cc} | ${base ? base[0] + base[1] : '-'} (${pv}) | ${bdom - 1} (${dv}) | ${builtIn ?? ''}${springs ? `${springs} spring` : ''} (${bv}) | ${cc - pv - dv - bv} |`);
  }
}
