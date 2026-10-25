'use strict';
// ---- the script (docs/12 S2.3, detailed mode): merge the stored log and the detail stream ----
// The battle JSON was made by battle-data/build.ts: the record as the sim stored it (refs
// replaced by group indices), the detail of BattleRecord.rerun, and foldReplay at every
// phase end. Blows are normalized into one shape; outcome comes from hit, landing and damage.

function decodeBlow(d, B) {
  const g = B.groups;
  if (d[0] === 's') {
    const [, at, round, ph, att, am, weapon, tgt, tm, hit, killed, dealt, hpBefore, rolled, berserk, first, attack, attackDrn, defense, defenseDrn] = d;
    let outcome = 'miss';
    if (hit) {
      if (hpBefore === 0) outcome = 'onFallen';
      else if (killed) outcome = 'kill';
      else if (rolled <= 0) outcome = 'blocked';
      else outcome = 'wound';
    }
    const w = weapon >= 0 ? g[att].weapons[weapon] : null;
    return {
      src: PHASES[ph] === 'ranged' ? 'ranged' : 'melee', at, round, phase: PHASES[ph],
      att, am, weapon, wname: w ? w.name : 'Unarmed', ranged: !!(w && w.range > 0),
      tgt, tm, outcome, dealt, hpBefore, rolled, berserk: !!berserk, first: !!first,
      rolls: { attack, attackDrn, defense, defenseDrn }, spell: null,
    };
  }
  if (d[0] === 'h') {
    const [, at, round, ph, caster, spell, effect, element, tgt, tm, killed, dealt, hpBefore] = d;
    let outcome = killed ? 'kill' : hpBefore === 0 ? 'onFallen' : dealt > 0 ? 'wound' : 'blocked';
    return { src: 'spell', at, round, phase: PHASES[ph], att: caster, am: 0, weapon: -1, wname: spell, ranged: false,
      tgt, tm, outcome, dealt, hpBefore, rolled: dealt, berserk: false, first: false, rolls: null, spell, effect, element };
  }
  if (d[0] === 'b') {
    const [, at, round, ph, unit, member, element, shield, owed, killed, dealt, hpBefore] = d;
    return { src: 'burn', at, round, phase: PHASES[ph], att: shield, am: 0, weapon: -1, wname: 'burn', ranged: false,
      tgt: unit, tm: member, outcome: killed ? 'kill' : dealt > 0 ? 'wound' : 'blocked', dealt, hpBefore, rolled: owed,
      berserk: false, first: false, rolls: null, spell: null, element };
  }
  return null;
}

function buildScript(B) {
  const groups = B.groups.map((g, i) => ({
    ...g, idx: i, isCmd: !!g.cmd, big: g.size >= 3,
    flying: (g.tags || []).includes('flying'),
    ranged: g.weapons.some((w) => w.range > 0),
  }));
  const rounds = [];
  let cur = { round: 0, phases: [] };
  let ph = null;
  const phaseAt = new Map();
  const mk = (kind, i) => ({ kind, round: cur.round, events: [], blows: [], morale: [], engage: null, drains: [], idx0: i, fold: null });
  B.replay.forEach((e, i) => {
    if (e.kind === 'roundStart') { cur = { round: e.round, phases: [] }; rounds.push(cur); ph = null; return; }
    if (e.kind === 'phase') { ph = mk(e.phase, i); cur.phases.push(ph); phaseAt.set(cur.round + '/' + e.phase, ph); return; }
    if (e.kind === 'battleEnd') return;
    if (!ph) { ph = mk('scripts', i); cur.phases.push(ph); phaseAt.set(cur.round + '/scripts', ph); }
    ph.events.push({ ...e, i });
  });
  for (const d of B.detail) {
    const p = phaseAt.get(d[2] + '/' + PHASES[d[3]]);
    if (!p) continue;
    if (d[0] === 'e') p.engage = { fronts: { attacker: d[4], defender: d[5] }, contact: d[6] };
    else if (d[0] === 'm') p.morale.push({ group: d[4], cause: ['losses', 'shock', 'commanderDeath'][d[5]],
      roll: { morale: d[6], moraleDrn: d[7], target: d[8], targetDrn: d[9], pressure: d[10] }, broke: !!d[11] });
    else if (d[0] === 'd') p.drains.push({ unit: d[4], member: d[5], gained: d[6] });
    else { const b = decodeBlow(d, B); if (b) { b.seq = p.blows.length; p.blows.push(b); } }
  }
  for (const f of B.folds) {
    const p = phaseAt.get(f.round + '/' + f.phase);
    if (p) p.fold = f;
  }
  // keys and per-phase bookkeeping
  for (const r of rounds) for (const p of r.phases) {
    p.blows.forEach((b, k) => { b.key = `r${r.round}/${p.kind}/${b.att}>${b.tgt}/${k}`; });
    p.casts = p.events.filter((e) => e.kind === 'cast');
    p.routs = p.events.filter((e) => e.kind === 'rout').map((e) => e.squad);
    p.leaves = p.events.filter((e) => e.kind === 'leave').map((e) => e.unit);
    p.deaths = p.events.filter((e) => e.kind === 'death').map((e) => e.commander);
    p.summons = p.events.filter((e) => e.kind === 'summon');
    p.advances = p.events.filter((e) => e.kind === 'advance');
    p.buffs = p.events.filter((e) => e.kind === 'buff');
    p.expires = p.events.filter((e) => e.kind === 'expire');
    p.heals = p.events.filter((e) => e.kind === 'heal');
    p.kills = p.blows.filter((b) => b.outcome === 'kill').length;
  }
  // the killing blow of every commander death
  for (const r of rounds) for (const p of r.phases) {
    p.deathInfo = p.deaths.map((c) => {
      const blow = p.blows.find((b) => b.tgt === c && b.outcome === 'kill') || null;
      return { commander: c, blow };
    });
  }
  // quiet rounds (S2.3): no death, cast, rout, summon, advance or leave, and few kills
  for (const r of rounds) {
    r.kills = r.phases.reduce((a, p) => a + p.kills, 0);
    const busy = r.phases.some((p) => p.casts.length || p.routs.length || p.deaths.length || p.summons.length || p.advances.length || p.leaves.length);
    r.quiet = !busy && r.kills <= 1;
  }
  return { B, groups, rounds, winner: B.winner, nearSide: B.nearSide };
}
