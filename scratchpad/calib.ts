import { CHASSIS, type ChassisId } from '/home/user/fm-6b3/src/content/pretenders/chassis';
import { lightInfantryEquivalent, aiPowerOf, LIGHT_INFANTRY_TERM } from '/home/user/fm-6b3/tests/sim/battle/fixtures/duel';
const t0 = performance.now();
console.log(LIGHT_INFANTRY_TERM);
for (const id of Object.keys(CHASSIS) as ChassisId[]) {
  const t = performance.now();
  const n = lightInfantryEquivalent(id);
  console.log(id, n, aiPowerOf(n), CHASSIS[id].aiPower, ((performance.now()-t)/1000).toFixed(1)+'s');
}
console.log(((performance.now()-t0)/1000).toFixed(1));
