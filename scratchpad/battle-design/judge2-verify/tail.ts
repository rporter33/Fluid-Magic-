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
