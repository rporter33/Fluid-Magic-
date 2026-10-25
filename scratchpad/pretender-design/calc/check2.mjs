import { cost } from './costs.mjs';
const R = 'R', G = 'G';
const b = [
  ['Undying Flame', R, { chassis: 'ashPhoenix', pips: { R: 4 }, dominion: 6, scales: { growth: 2, lore: -2, order: -1 }, awakening: 'awake' }],
  ['Pyre Host', R, { chassis: 'pyreLord', pips: { R: 4 }, dominion: 4, scales: { lore: -3, order: -3 }, boons: ['ironWill'], awakening: 'awake' }],
  ['Dread Idol', R, { chassis: 'cinderIdol', pips: { R: 4 }, dominion: 9, scales: { sanctity: -3, order: -1 }, awakening: 'awake' }],
  ['Heartwood', G, { chassis: 'worldTree', pips: { G: 4 }, dominion: 7, scales: { growth: 2, wild: 2, sanctity: 1 }, boons: ['sacredSpring'], awakening: 'awake' }],
  ['Hunt Lord', G, { chassis: 'hornedHunter', pips: { G: 4 }, dominion: 4, scales: { lore: -2, wild: 2, growth: 2 }, boons: ['ironWill'], awakening: 'awake' }],
  ['Mother of the Pack', G, { chassis: 'motherOfBeasts', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, boons: ['ironWill'], awakening: 'awake' }],
  ['Hero bless rush', R, { chassis: 'ascendedHero', pips: { R: 4 }, dominion: 5, scales: { lore: -3, order: -1 }, boons: ['chosenHost'], awakening: 'awake' }],
  ['Elder Wyrm awake G4', G, { chassis: 'elderWyrm', pips: { G: 4 }, dominion: 3, scales: { growth: 2, wild: 1 }, awakening: 'awake' }],
  ['Living Flame', R, { chassis: 'livingFlame', pips: { R: 4 }, dominion: 4, scales: { lore: -3, order: -1 }, boons: ['ironWill'], awakening: 'awake' }],
  ['Briar King', G, { chassis: 'briarKing', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 2 }, awakening: 'awake' }],
  ['Hierophant', R, { chassis: 'emberHierophant', pips: { R: 6 }, dominion: 3, scales: { lore: -3 }, boons: ['deepLore'], awakening: 'awake' }],
  ['Primordial dormant R', R, { chassis: 'primordial', pips: { R: 4 }, dominion: 8, scales: { lore: -3, order: -3, growth: 1 }, awakening: 'dormant' }],
  ['Wild Spirit avatar', G, { chassis: 'wildSpirit', pips: { G: 4 }, dominion: 5, scales: { growth: 3, wild: 1 }, boons: ['avatar'], awakening: 'awake' }],
  ['Monolith in Cinder (realm check n/a)', R, { chassis: 'livingMonolith', pips: { R: 2 }, dominion: 10, scales: { lore: -1 }, awakening: 'awake' }],
];
for (const [n, nat, d] of b) { const r = cost(nat, d); console.log(`${r.ok ? 'OK ' : 'BAD'} ${n}: ${r.t}/${r.budget} ${JSON.stringify(r.parts)} BP ${r.bp}`); }
