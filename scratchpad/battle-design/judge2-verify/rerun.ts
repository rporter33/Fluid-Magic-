import { commander, side, squad } from '/home/user/fm-godless/tests/sim/battle/fixtures';
import { spellDef } from '/home/user/fm-godless/src/content/spells';
import type { BattleSpellDef } from '/home/user/fm-godless/src/content/spells/types';
import { resolveBattle } from '/home/user/fm-godless/src/sim/battle/resolve';
import { createRng, cloneRng } from '/home/user/fm-godless/src/sim/rng';
import type { BattleSetup } from '/home/user/fm-godless/src/sim/battle/types';
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
function toRecord(s: BattleSetup): unknown {
  const strip = (side: BattleSetup['attacker']) => ({ ...side, commanders: side.commanders.map((c) => ({ ...c, spells: c.spells.map((x) => x.id) })) });
  return JSON.parse(JSON.stringify({ province: s.province, attacker: strip(s.attacker), defender: strip(s.defender) }));
}
function fromRecord(r: any): BattleSetup {
  const fix = (side: any) => ({ ...side, commanders: side.commanders.map((c: any) => ({ ...c, spells: c.spells.map((id: string) => sp(id)) })) });
  return { province: r.province, attacker: fix(r.attacker), defender: fix(r.defender) };
}
let ok = 0, bad = 0; let setupBytes = 0, setupGz = 0, recBytes = 0, recGz = 0;
for (let seed = 1; seed <= 40; seed++) {
  const setup = big();
  const rng = createRng(seed); const rng0 = cloneRng(rng);
  const live = resolveBattle(setup, rng);
  const rec = toRecord(setup);
  const re = resolveBattle(fromRecord(rec), cloneRng(rng0));
  if (isDeepStrictEqual(re.replay, live.replay) && re.winner === live.winner) ok++; else bad++;
  const sj = JSON.stringify(rec); setupBytes += sj.length; setupGz += gzipSync(sj).length;
  const rj = JSON.stringify({ roster: live.roster, replay: live.replay }); recBytes += rj.length; recGz += gzipSync(rj).length;
}
console.log({ ok, bad, setupKB: (setupBytes / 40 / 1024).toFixed(1), setupGzKB: (setupGz / 40 / 1024).toFixed(1), recordKB: (recBytes / 40 / 1024).toFixed(1), recordGzKB: (recGz / 40 / 1024).toFixed(1) });
// non-finite numbers in setup?
const s = big(); const bad2: string[] = [];
JSON.stringify(s, (k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) bad2.push(k); return v; });
console.log('non-finite fields', bad2);
