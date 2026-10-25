import { commander, side, squad, setup } from '/home/user/fm-godless/tests/sim/battle/fixtures';
import { spellDef } from '/home/user/fm-godless/src/content/spells';
import type { BattleSpellDef } from '/home/user/fm-godless/src/content/spells/types';
import { resolveBattle } from '/home/user/fm-godless/src/sim/battle/resolve';
import { createRng, cloneRng } from '/home/user/fm-godless/src/sim/rng';
import { gzipSync } from 'node:zlib';
const sp = (id: string) => spellDef(id as never) as BattleSpellDef;
const cast = (id: string | null) => ({ kind: 'cast' as const, spellId: id });
function small() {
  const a = side(
    [squad('a1', 'cinderWarrior', 20, { leader: 'ac' }), squad('a2', 'flameArcher', 10, { leader: 'ac' })],
    [
      commander('ac', 'ashChieftain'),
      commander('am', 'emberAdept', { spells: [sp('emberDart')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  const d = side(
    [squad('d1', 'warden', 20, { leader: 'dc' }), squad('d2', 'longbowHunter', 10, { leader: 'dc' })],
    [
      commander('dc', 'wardenCaptain'),
      commander('dm', 'saplingDruid', { spells: [sp('thornSpray')], script: Array(5).fill(cast(null)) }),
      commander('dp', 'grovePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  return [a, d] as const;
}

function big() {
  const a = side(
    [
      squad('a1', 'cinderWarrior', 60, { leader: 'ac1' }),
      squad('a2', 'cinderWarrior', 40, { leader: 'ac2' }),
      squad('a3', 'flameArcher', 60, { leader: 'ac1' }),
      squad('a4', 'berserker', 40, { leader: 'ac2' }),
      squad('a5', 'ashRider', 40, { leader: 'ac3' }),
      squad('a6', 'emberSkirmisher', 30, { leader: 'ac3' }),
      squad('a7', 'flamebrand', 30, { leader: 'ac1' }),
    ],
    [
      commander('ac1', 'ashChieftain'),
      commander('ac2', 'ashChieftain'),
      commander('ac3', 'ashChieftain'),
      commander('am1', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('pyreStorm'), sp('warcry'), sp('bloodFury')], carriedMana: { R: 3 }, pips: { R: 3 }, script: Array(5).fill(cast(null)) }),
      commander('am2', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('bloodFury')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  const d = side(
    [
      squad('d1', 'warden', 60, { leader: 'dc1' }),
      squad('d2', 'warden', 40, { leader: 'dc2' }),
      squad('d3', 'longbowHunter', 80, { leader: 'dc1' }),
      squad('d4', 'briarGuard', 40, { leader: 'dc2' }),
      squad('d5', 'wolfRider', 40, { leader: 'dc3' }),
      squad('d6', 'oakheart', 40, { leader: 'dc3' }),
    ],
    [
      commander('dc1', 'wardenCaptain'),
      commander('dc2', 'wardenCaptain'),
      commander('dc3', 'wardenCaptain'),
      commander('dm1', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle'), sp('swarm'), sp('regrowth')], carriedMana: { G: 3 }, pips: { G: 3 }, script: Array(5).fill(cast(null)) }),
      commander('dm2', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle')], script: Array(5).fill(cast(null)) }),
      commander('dt', 'treant', { spells: [sp('thornSpray')], script: [cast(null), { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }] }),
    ],
  );
  return [a, d] as const;
}


function toRecord(s: any) {
  const strip = (side: any) => ({ ...side, commanders: side.commanders.map((c: any) => ({ ...c, spells: c.spells.map((x: any) => x.id) })) });
  return JSON.parse(JSON.stringify({ province: s.province, attacker: strip(s.attacker), defender: strip(s.defender) }));
}
function fromRecord(r: any) {
  const fix = (side: any) => ({ ...side, commanders: side.commanders.map((c: any) => ({ ...c, spells: c.spells.map((id: string) => sp(id)) })) });
  return { province: r.province, attacker: fix(r.attacker), defender: fix(r.defender) };
}
for (const [name, mk] of [['small', small], ['big', big]] as const) {
  let mism = 0; let setupBytes = 0; let fullBytes = 0; let gz = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const [a, d] = mk();
    const s = setup(a, d);
    const rng = createRng(seed);
    const rng0 = cloneRng(rng);
    const r1 = resolveBattle(s, rng);
    const rec = toRecord(s);
    const json = JSON.stringify({ setup: rec, rng: rng0 });
    setupBytes = json.length; fullBytes = JSON.stringify(s).length; gz = gzipSync(json).length;
    const r2 = resolveBattle(fromRecord(JSON.parse(json).setup), JSON.parse(json).rng);
    if (JSON.stringify(r1.replay) !== JSON.stringify(r2.replay) || r1.winner !== r2.winner) mism++;
  }
  console.log(name, { mismatches: mism, rerunJson: setupBytes, fullSetupJson: fullBytes, rerunGz: gz });
}
