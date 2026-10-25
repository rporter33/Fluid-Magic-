import { gzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import * as P from './tests/sim/battle/fixtures';
import { spellDef as pSpell } from './src/content/spells';
import { resolveBattle as pResolve } from './src/sim/battle/resolve';
import { createRng as pRng, cloneRng } from './src/sim/rng';
import * as B from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
import { spellDef as bSpell } from '/home/user/Fluid-Magic-/src/content/spells';
import { resolveBattle as bResolve } from '/home/user/Fluid-Magic-/src/sim/battle/resolve';
import { createRng as bRng } from '/home/user/Fluid-Magic-/src/sim/rng';

function build(F: any, spellDef: any, kind: 'small' | 'big') {
  const sp = (id: string) => spellDef(id);
  const cast = (id: string | null) => ({ kind: 'cast' as const, spellId: id });
  const { side, squad, commander } = F;
  if (kind === 'small') {
    const a = side([squad('a1', 'cinderWarrior', 20, { leader: 'ac' }), squad('a2', 'flameArcher', 10, { leader: 'ac' })],
      [commander('ac', 'ashChieftain'), commander('am', 'emberAdept', { spells: [sp('emberDart')], script: Array(5).fill(cast(null)) }), commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]);
    const d = side([squad('d1', 'warden', 20, { leader: 'dc' }), squad('d2', 'longbowHunter', 10, { leader: 'dc' })],
      [commander('dc', 'wardenCaptain'), commander('dm', 'saplingDruid', { spells: [sp('thornSpray')], script: Array(5).fill(cast(null)) }), commander('dp', 'grovePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]);
    return { province: 'p0', attacker: a, defender: d };
  }
  const a = side([
      squad('a1', 'cinderWarrior', 60, { leader: 'ac1' }), squad('a2', 'cinderWarrior', 40, { leader: 'ac2' }),
      squad('a3', 'flameArcher', 60, { leader: 'ac1' }), squad('a4', 'berserker', 40, { leader: 'ac2' }),
      squad('a5', 'ashRider', 40, { leader: 'ac3' }), squad('a6', 'emberSkirmisher', 30, { leader: 'ac3' }),
      squad('a7', 'flamebrand', 30, { leader: 'ac1' })],
    [commander('ac1', 'ashChieftain'), commander('ac2', 'ashChieftain'), commander('ac3', 'ashChieftain'),
      commander('am1', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('pyreStorm'), sp('warcry'), sp('bloodFury')], carriedMana: { R: 3 }, pips: { R: 3 }, script: Array(5).fill(cast(null)) }),
      commander('am2', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('bloodFury')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]);
  const d = side([
      squad('d1', 'warden', 60, { leader: 'dc1' }), squad('d2', 'warden', 40, { leader: 'dc2' }),
      squad('d3', 'longbowHunter', 80, { leader: 'dc1' }), squad('d4', 'briarGuard', 40, { leader: 'dc2' }),
      squad('d5', 'wolfRider', 40, { leader: 'dc3' }), squad('d6', 'oakheart', 40, { leader: 'dc3' })],
    [commander('dc1', 'wardenCaptain'), commander('dc2', 'wardenCaptain'), commander('dc3', 'wardenCaptain'),
      commander('dm1', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle'), sp('swarm'), sp('regrowth')], carriedMana: { G: 3 }, pips: { G: 3 }, script: Array(5).fill(cast(null)) }),
      commander('dm2', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle')], script: Array(5).fill(cast(null)) }),
      commander('dt', 'treant', { spells: [sp('thornSpray')], script: [cast(null), { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }] })]);
  return { province: 'p0', attacker: a, defender: d };
}
const strip = (e: any) => { if (e.kind === 'phase') return null; const { attacks, blocked, onFallen, dmg, by, fatigue, ...rest } = e; return rest; };
const toSetupRecord = (s: any) => { const st = (side: any) => ({ ...side, commanders: side.commanders.map((c: any) => ({ ...c, spells: c.spells.map((x: any) => x.id) })) }); return JSON.parse(JSON.stringify({ province: s.province, attacker: st(s.attacker), defender: st(s.defender) })); };
const kb = (n: number) => (n / 1024).toFixed(1);
for (const [kind, n] of [['small', 50], ['big', 20]] as const) {
  let same = 0; const acc = { base: 0, baseGz: 0, add: 0, addGz: 0, setup: 0, setupGz: 0, full: 0, fullGz: 0, events: 0, phase: 0 };
  let wounds = 0, hits = 0, blocked = 0, onFallen = 0, kills = 0, attacks = 0, maxPhaseKills = 0;
  for (let seed = 1; seed <= n; seed++) {
    const ps = build(P, pSpell, kind); const r0 = pRng(seed); const rng0 = cloneRng(r0);
    const pr = pResolve(ps as any, r0);
    const br = bResolve(build(B, bSpell, kind) as any, bRng(seed));
    const stripped = pr.replay.map(strip).filter((e: any) => e !== null);
    if (isDeepStrictEqual(stripped, br.replay) && pr.winner === br.winner && pr.rounds === br.rounds) same++;
    const head = { id: 'b123', day: 400, province: 'p17', attacker: 'n0', defender: 'n1', winner: pr.winner, rounds: pr.rounds, roster: pr.roster };
    const base = JSON.stringify({ ...head, replay: br.replay });
    const add = JSON.stringify({ ...head, replay: pr.replay, scene: { terrain: 'hills', storm: null } });
    const setupJ = JSON.stringify({ setup: toSetupRecord(ps), rng: rng0 });
    const full = JSON.stringify({ ...head, replay: pr.replay, scene: { terrain: 'hills', storm: null }, rerun: JSON.parse(setupJ) });
    acc.base += base.length; acc.baseGz += gzipSync(base).length; acc.add += add.length; acc.addGz += gzipSync(add).length;
    acc.setup += setupJ.length; acc.setupGz += gzipSync(setupJ).length; acc.full += full.length; acc.fullGz += gzipSync(full).length;
    acc.events += pr.replay.length; acc.phase += pr.replay.filter((e: any) => e.kind === 'phase').length;
    let pk = 0;
    for (const e of pr.replay as any[]) {
      if (e.kind === 'phase' || e.kind === 'roundStart') { maxPhaseKills = Math.max(maxPhaseKills, pk); pk = 0; }
      if (e.kind === 'melee' || e.kind === 'volley') { attacks += e.attacks; hits += e.hits; blocked += e.blocked; onFallen += e.onFallen; kills += e.kills; wounds += e.hits - e.blocked - e.onFallen - e.kills; pk += e.kills; }
    }
  }
  console.log(kind, { battles: n, observationOnly: `${same}/${n}`, perRecordKB: { base: kb(acc.base / n), baseGz: kb(acc.baseGz / n), withA1toA5: kb(acc.add / n), withA1toA5Gz: kb(acc.addGz / n), rerunSetup: kb(acc.setup / n), rerunSetupGz: kb(acc.setupGz / n), fullRecord: kb(acc.full / n), fullRecordGz: kb(acc.fullGz / n) }, events: (acc.events / n).toFixed(0), phaseMarkers: (acc.phase / n).toFixed(0), perBattle: { attacks: attacks / n, hits: hits / n, blocked: blocked / n, onFallen: onFallen / n, kills: kills / n, wounds: wounds / n }, maxKillsInOnePhase: maxPhaseKills, twentyFullRecordsKB: kb(20 * acc.full / n), twentyGzKB: kb(20 * acc.fullGz / n) });
}
