import { commander, side, squad } from './tests/sim/battle/fixtures';
import { spellDef } from './src/content/spells';
import type { BattleSpellDef } from './src/content/spells/types';
import { resolveBattle } from './src/sim/battle/resolve';
import { createRng, cloneRng } from './src/sim/rng';
import type { BattleSetup } from './src/sim/battle/types';
import { gzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';

const sp = (id: string) => spellDef(id as never) as BattleSpellDef;
const cast = (id: string | null) => ({ kind: 'cast' as const, spellId: id });
function big(): BattleSetup {
  const a = side(
    [
      squad('a1', 'cinderWarrior', 60, { leader: 'ac1' }), squad('a2', 'cinderWarrior', 40, { leader: 'ac2' }),
      squad('a3', 'flameArcher', 60, { leader: 'ac1' }), squad('a4', 'berserker', 40, { leader: 'ac2' }),
      squad('a5', 'ashRider', 40, { leader: 'ac3' }), squad('a6', 'emberSkirmisher', 30, { leader: 'ac3' }),
      squad('a7', 'flamebrand', 30, { leader: 'ac1' }),
    ],
    [
      commander('ac1', 'ashChieftain'), commander('ac2', 'ashChieftain'), commander('ac3', 'ashChieftain'),
      commander('am1', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('pyreStorm'), sp('warcry'), sp('bloodFury')], carriedMana: { R: 3 }, pips: { R: 3 }, script: Array(5).fill(cast(null)) }),
      commander('am2', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('bloodFury')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  const d = side(
    [
      squad('d1', 'warden', 60, { leader: 'dc1' }), squad('d2', 'warden', 40, { leader: 'dc2' }),
      squad('d3', 'longbowHunter', 80, { leader: 'dc1' }), squad('d4', 'briarGuard', 40, { leader: 'dc2' }),
      squad('d5', 'wolfRider', 40, { leader: 'dc3' }), squad('d6', 'oakheart', 40, { leader: 'dc3' }),
    ],
    [
      commander('dc1', 'wardenCaptain'), commander('dc2', 'wardenCaptain'), commander('dc3', 'wardenCaptain'),
      commander('dm1', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle'), sp('swarm'), sp('regrowth')], carriedMana: { G: 3 }, pips: { G: 3 }, script: Array(5).fill(cast(null)) }),
      commander('dm2', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle')], script: Array(5).fill(cast(null)) }),
      commander('dt', 'treant', { spells: [sp('thornSpray')], script: [cast(null), { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }] }),
    ],
  );
  return { province: 'p0' as never, attacker: a, defender: d };
}
import { STATS } from './src/sim/battle/attacks';
function small(): BattleSetup {
  const a = side([squad('a1', 'cinderWarrior', 20, { leader: 'ac' }), squad('a2', 'flameArcher', 10, { leader: 'ac' })],
    [commander('ac', 'ashChieftain'), commander('am', 'emberAdept', { spells: [sp('emberDart')], script: Array(5).fill(cast(null)) }), commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]);
  const d = side([squad('d1', 'warden', 20, { leader: 'dc' }), squad('d2', 'longbowHunter', 10, { leader: 'dc' })],
    [commander('dc', 'wardenCaptain'), commander('dm', 'saplingDruid', { spells: [sp('thornSpray')], script: Array(5).fill(cast(null)) }), commander('dp', 'grovePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]);
  return { province: 'p0' as never, attacker: a, defender: d };
}
for (const [name, mk, n] of [['small', small, 50], ['big', big, 20]] as const) {
  const reset = () => { STATS.attacks = 0; for (const k of ['volley', 'melee'] as const) Object.assign(STATS.byKind[k], { attacks: 0, hits: 0, zero: 0, wasted: 0, dmg: 0 }); STATS.phases.length = 0; };
  reset();
  let maxMeleeAtt = 0, maxMeleeHits = 0, maxMeleeKills = 0, phasesM = 0, phasesV = 0, maxVolleyAtt = 0;
  for (let seed = 1; seed <= n; seed++) {
    const before = STATS.phases.length;
    resolveBattle(mk(), createRng(seed));
    for (const p of STATS.phases.slice(before)) {
      if (p.kind === 'melee' && p.attacks > 0) { phasesM++; maxMeleeAtt = Math.max(maxMeleeAtt, p.attacks); maxMeleeHits = Math.max(maxMeleeHits, p.hits); maxMeleeKills = Math.max(maxMeleeKills, p.kills); }
      if (p.kind === 'volley' && p.attacks > 0) { phasesV++; maxVolleyAtt = Math.max(maxVolleyAtt, p.attacks); }
    }
  }
  const m = STATS.byKind.melee, v = STATS.byKind.volley;
  console.log(name, {
    meleePerBattle: { attacks: m.attacks / n, hits: m.hits / n, zeroDmgHits: m.zero / n, wastedOnDead: m.wasted / n, dmg: Math.round(m.dmg / n) },
    volleyPerBattle: { attacks: v.attacks / n, hits: v.hits / n, zeroDmgHits: v.zero / n, wastedOnDead: v.wasted / n },
    meleePhasesPerBattle: phasesM / n, volleyPhasesPerBattle: phasesV / n, maxMeleeAttacksInPhase: maxMeleeAtt, maxMeleeHitsInPhase: maxMeleeHits, maxMeleeKillsInPhase: maxMeleeKills, maxVolleyAttacks: maxVolleyAtt,
  });
}
