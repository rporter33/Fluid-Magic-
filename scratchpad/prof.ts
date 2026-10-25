import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { createCommander, createSquad } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import { updateExplored, visionOf } from '/home/user/Fluid-Magic-/src/sim/visibility';
import { allProvinceEconomies } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { advanceTransits, continueMoves } from '/home/user/Fluid-Magic-/src/sim/movement';
import { applySupply } from '/home/user/Fluid-Magic-/src/sim/supply';
const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' } as const;
const s = createGame({ seed: 4, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: { ...pre }, ai: null },
  { nation: 'thornwood', pretender: { ...pre }, ai: { difficulty: 'easy' } },
  { nation: 'cinderHorde', pretender: { ...pre }, ai: { difficulty: 'normal' } },
  { nation: 'thornwood', pretender: { ...pre }, ai: { difficulty: 'normal' } },
] } as never);
const nations = Object.keys(s.nations);
const provs = Object.keys(s.provinces);
for (let k = 0; k < 200; k++) {
  const c = createCommander(s, 'ashChieftain', nations[k % 4] as never, provs[k % provs.length] as never);
  c.squads.push(createSquad(s, 'cinderWarrior', 20));
}
for (let d = 0; d < 50; d++) advance(s);
function time(label: string, f: () => void, n = 300) { const t = performance.now(); for (let i = 0; i < n; i++) f(); console.log(label, ((performance.now() - t) / n).toFixed(3), 'ms'); }
time('advance', () => advance(s));

time('visionOf x1', () => visionOf(s, nations[0] as never));
time('updateExplored', () => updateExplored(s));
time('economies', () => allProvinceEconomies(s));
time('supply', () => applySupply(s, allProvinceEconomies(s)));
time('transits', () => { advanceTransits(s); continueMoves(s); });
import { commandersByProvince } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { allVision, isStealthy } from '/home/user/Fluid-Magic-/src/sim/visibility';
time('byProvince', () => commandersByProvince(s));
time('allVision', () => allVision(s));
const cs = Object.values(s.commanders);
time('isStealthy all', () => { for (const c of cs) isStealthy(c); });
time('new Set ids x4', () => { for (let k=0;k<4;k++) new Set(cs.map(c=>c.id)); });
time('isStealthy warm', () => { for (const c of cs) isStealthy(c); }, 5000);

time('advance warm', () => advance(s), 2000);
import { unitDef } from '/home/user/Fluid-Magic-/src/content';
time('unit tag only', () => { for (const c of cs) unitDef(c.unit).tags.includes('stealthy'); }, 5000);
time('unit lookup only', () => { for (const c of cs) unitDef(c.unit); }, 5000);
time('loop only', () => { let n = 0; for (const c of cs) n += c.squads.length; }, 5000);
console.log(cs.length);
