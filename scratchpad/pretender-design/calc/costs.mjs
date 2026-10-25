// Mirrors src/sim/pretender.ts designCost with the proposed rules: per-chassis first pip of a
// new color, scale attunement (own-color price), boons. Bless points and blessing costs too.
const PIP = [40, 20, 25, 30, 35, 40], DOM = 30, OWN = 20, OTHER = 40, BUDGET = 400;
const REFUND = { awake: 0, dormant: 150, imprisoned: 350 };
const POLE = { order: { pos: 'W', neg: 'R' }, lore: { pos: 'U', neg: 'R' }, growth: { pos: 'G', neg: 'B' }, wild: { pos: 'G', neg: 'U' }, sanctity: { pos: 'W', neg: 'B' } };
const C = {
  oracle: [20, null, 1, 40, 10], titan: [120, ['nation', 1], 2, 60], greatWyrm: [220, ['nation', 2], 2, 80],
  livingMonolith: [60, null, 4, 50], ascendedHero: [70, ['nation', 1], 2, 50], primordial: [160, ['nation', 2], 3, 80, 0, 'dormant'],
  ashColossus: [100, ['R', 1], 1, 60], ashPhoenix: [100, ['R', 1], 2, 80, 0, null, [['growth', 1]]], pyreLord: [140, ['R', 2], 2, 60],
  cinderIdol: [110, ['R', 2], 4, 50, 0, null, [['sanctity', -1]]], emberHierophant: [60, ['R', 2], 1, 40], livingFlame: [150, ['R', 2], 2, 80],
  wildSpirit: [80, ['G', 1], 2, 80], worldTree: [130, ['G', 3], 4, 50, 0, null, [['sanctity', 1]]], hornedHunter: [130, ['G', 2], 2, 60, 0, null, [['lore', -1]]],
  elderWyrm: [170, ['G', 1], 2, 80], motherOfBeasts: [110, ['G', 1], 2, 60], briarKing: [120, ['G', 2], 2, 60],
};
const BOON = { sacredSpring: 40, avatar: 40, undying: 70, chosenHost: 60, deepLore: 50, ironWill: 20 };
export function cost(nation, d) {
  const [ccost, base, bdom, newColor, disc = 0, minAw, att = []] = C[d.chassis];
  const free = {}; if (base) free[base[0] === 'nation' ? nation : base[0]] = base[1];
  let t = ccost; const parts = { chassis: ccost, pips: 0, dominion: 0, scales: 0, boons: 0 };
  for (const [c, n] of Object.entries(d.pips)) for (let l = (free[c] ?? 0) + 1; l <= n; l++) {
    const p = (l === 1 && c !== nation ? newColor : PIP[l - 1]) - disc; t += p; parts.pips += p; }
  const dp = Math.max(0, d.dominion - bdom) * DOM; t += dp; parts.dominion = dp;
  for (const [ax, v] of Object.entries(d.scales ?? {})) { if (!v) continue; const pole = v > 0 ? POLE[ax].pos : POLE[ax].neg;
    const attuned = att.some(([a, s]) => a === ax && Math.sign(s) === Math.sign(v));
    const s = Math.abs(v) * (pole === nation || attuned ? OWN : OTHER); t += s; parts.scales += s; }
  for (const b of d.boons ?? []) { t += BOON[b]; parts.boons += BOON[b]; }
  const budget = BUDGET + REFUND[d.awakening];
  const bp = Object.values(d.pips).reduce((s, n) => s + Math.max(0, n - 1), 0);
  return { t, budget, ok: t <= budget && (!minAw || d.awakening !== 'awake'), parts, bp };
}
const R = 'R', G = 'G';
const builds = [
  // existing presets (must equal today's costs: 385, 280?, ...)
  ['preset Warlord', R, { chassis: 'titan', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -2 }, awakening: 'awake' }],
  ['preset Ember Oracle', R, { chassis: 'oracle', pips: { R: 6 }, dominion: 4, scales: { lore: -2 }, awakening: 'dormant' }],
  ['preset Wildfire', R, { chassis: 'ashColossus', pips: { R: 3 }, dominion: 6, scales: { order: -3, lore: -3 }, awakening: 'imprisoned' }],
  ['preset Elder Oak', G, { chassis: 'titan', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, awakening: 'awake' }],
  ['preset Deep Root', G, { chassis: 'livingMonolith', pips: { G: 3 }, dominion: 7, scales: { growth: 3, wild: 3, sanctity: 1 }, awakening: 'awake' }],
  ['preset Wyrm of the Loam', G, { chassis: 'greatWyrm', pips: { G: 4 }, dominion: 4, scales: { growth: 2 }, awakening: 'dormant' }],
  // new presets
  ['NEW preset Undying Flame', R, { chassis: 'ashPhoenix', pips: { R: 4 }, dominion: 5, scales: { growth: 2, lore: -2 }, awakening: 'awake' }],
  ['NEW preset Pyre Host', R, { chassis: 'pyreLord', pips: { R: 4 }, dominion: 4, scales: { lore: -3, order: -2 }, boons: ['ironWill'], awakening: 'awake' }],
  ['NEW preset Dread Idol', R, { chassis: 'cinderIdol', pips: { R: 4 }, dominion: 9, scales: { sanctity: -3, order: -1 }, awakening: 'awake' }],
  ['NEW preset Heartwood', G, { chassis: 'worldTree', pips: { G: 4 }, dominion: 7, scales: { growth: 2, wild: 1, sanctity: 1 }, boons: [], awakening: 'awake' }],
  ['NEW preset Hunt Lord', G, { chassis: 'hornedHunter', pips: { G: 4 }, dominion: 4, scales: { lore: -2, wild: 2, growth: 1 }, boons: ['ironWill'], awakening: 'awake' }],
  ['NEW preset Mother of the Pack', G, { chassis: 'motherOfBeasts', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, boons: ['ironWill'], awakening: 'awake' }],
  // example builds per new chassis
  ['ex Ascended Hero bless rush (R)', R, { chassis: 'ascendedHero', pips: { R: 4 }, dominion: 6, scales: { lore: -3, order: -1 }, boons: ['chosenHost'], awakening: 'awake' }],
  ['ex Ascended Hero double bless (G)', G, { chassis: 'ascendedHero', pips: { G: 6 }, dominion: 4, scales: { growth: 2 }, awakening: 'awake' }],
  ['ex Primordial sleeper (R)', R, { chassis: 'primordial', pips: { R: 4 }, dominion: 8, scales: { lore: -3, order: -3, growth: 1 }, boons: [], awakening: 'dormant' }],
  ['ex Primordial imprisoned (G)', G, { chassis: 'primordial', pips: { G: 4 }, dominion: 10, scales: { growth: 3, wild: 3, order: 2, lore: 1 }, boons: ['sacredSpring'], awakening: 'imprisoned' }],
  ['ex Hierophant battle mage', R, { chassis: 'emberHierophant', pips: { R: 6 }, dominion: 3, scales: { lore: -2 }, boons: ['deepLore'], awakening: 'awake' }],
  ['ex Oracle rainbow (R)', R, { chassis: 'oracle', pips: { R: 4, G: 2, U: 2 }, dominion: 4, scales: { lore: 1 }, awakening: 'dormant' }],
  ['ex Living Flame', R, { chassis: 'livingFlame', pips: { R: 4 }, dominion: 4, scales: { lore: -2 }, boons: ['ironWill'], awakening: 'awake' }],
  ['ex Elder Wyrm (dormant)', G, { chassis: 'elderWyrm', pips: { G: 4 }, dominion: 6, scales: { growth: 3, wild: 3 }, boons: ['deepLore'], awakening: 'dormant' }],
  ['ex Elder Wyrm awake', G, { chassis: 'elderWyrm', pips: { G: 3 }, dominion: 3, scales: { growth: 2 }, boons: [], awakening: 'awake' }],
  ['ex Briar King', G, { chassis: 'briarKing', pips: { G: 4 }, dominion: 5, scales: { growth: 2, wild: 2 }, boons: [], awakening: 'awake' }],
  ['ex Wild Spirit raider + avatar', G, { chassis: 'wildSpirit', pips: { G: 4 }, dominion: 5, scales: { growth: 2, wild: 1 }, boons: ['avatar'], awakening: 'awake' }],
  ['ex Ash Colossus + undying', R, { chassis: 'ashColossus', pips: { R: 4 }, dominion: 4, scales: { lore: -2 }, boons: ['undying'], awakening: 'awake' }],
  ['ex Great Wyrm R4 awake', R, { chassis: 'greatWyrm', pips: { R: 4 }, dominion: 3, scales: { lore: -1 }, awakening: 'awake' }],
  ['ex Titan R4 G2 splash', R, { chassis: 'titan', pips: { R: 4, G: 2 }, dominion: 4, scales: { lore: -1 }, awakening: 'awake' }],
  ['ex Monolith dominion 10', G, { chassis: 'livingMonolith', pips: { G: 2 }, dominion: 10, scales: { growth: 2 }, awakening: 'awake' }],
];
if (process.argv[1].endsWith("costs.mjs")) for (const [name, n, d] of builds) { const r = cost(n, d); console.log(`${r.ok ? 'OK ' : 'BAD'} ${name}: ${r.t} / ${r.budget}  ${JSON.stringify(r.parts)} BP ${r.bp}`); }
