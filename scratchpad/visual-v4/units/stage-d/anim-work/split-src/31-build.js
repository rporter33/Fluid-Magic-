'use strict';
// ---- buildTimeline: pacing (S2.7), choreography (design section 6), sampling (section 5) ----
// The phases live in 31a to 31c (split for size, stage D animation part); TL_PHASES (32-finish.js) maps their names.

const SPELL_LOOK = {
  emberDart: { color: 0xff8a3a, travel: 0.35, kind: 'bolt', level: 1 },
  fireball: { color: 0xff6a20, travel: 0.55, kind: 'lob', level: 2 },
  warcry: { color: 0xd9543a, travel: 0.0, kind: 'ripple', level: 2 },
  bloodFury: { color: 0xb02a2a, travel: 0.3, kind: 'tendril', level: 3 },
  pyreStorm: { color: 0xff5a10, travel: 0.6, kind: 'meteors', level: 5 },
  thornSpray: { color: 0x7fae4a, travel: 0.4, kind: 'crack', level: 1 },
  barkSkin: { color: 0x9b7b4a, travel: 0.2, kind: 'leaves', level: 2 },
  entangle: { color: 0x5a8a3a, travel: 0.3, kind: 'vines', level: 3 },
  swarm: { color: 0xc9b030, travel: 0.4, kind: 'summon', level: 4 },
  regrowth: { color: 0x7fd07a, travel: 0.3, kind: 'wave', level: 5 },
  bless: { color: 0xf0d27a, travel: 0.0, kind: 'column', level: 0 },
};
const SPELL_NAMES = { emberDart: 'Ember Dart', fireball: 'Fireball', warcry: 'Warcry', bloodFury: 'Blood Fury', pyreStorm: 'Pyre Storm',
  thornSpray: 'Thorn Spray', barkSkin: 'Bark Skin', entangle: 'Entangle', swarm: 'Swarm', regrowth: 'Regrowth', bless: 'Bless' };

function plural(g) {
  const n = g.unitName;
  if (g.isCmd) return displayName(g);
  if (/f$/.test(n)) return n.slice(0, -1) + 'ves';
  if (/[sx]$/.test(n)) return n;
  if (/y$/.test(n)) return n.slice(0, -1) + 'ies';
  return n + 's';
}
function displayName(g) {
  if (g.isCmd) return g.pretender ? g.name : g.personal ? `${g.personal}, ${g.unitName}` : g.unitName;
  if (g.pd) return 'Provincial defense';
  return plural(g);
}

function buildTimeline(S, L) {
  const T = makeTimeline(S, L);
  const B = S.B;
  const tmp = { x: 0, y: 0, h: 0 };
  const groupOf = (i) => S.groups[i];
  const near = S.nearSide;
  const sideSign = (side) => (side === near ? -1 : 1);
  const isBlock = (G) => G.kind !== 'commander' && G.kind !== 'body';
  const aliveAt = (f, t) => !f.death || f.death.t > t;
  const present = (G, t) => G.appear <= t && (G.leaveT === null || G.leaveT > t);
  const liveFigs = (G, t) => G.figs.map((i) => T.F[i]).filter((f) => aliveAt(f, t));
  const figOf = (gi, m) => T.F[T.G[gi].memberFig[m] ?? T.G[gi].memberFig[0]];
  const storm = B.storm && B.storm.wallsStanding;
  const defenderSide = 'defender';
  const W = { wallH: 46, walk: 40 };
  T.storm = B.storm;

  // ---- state ----
  const spellCount = new Map();
  const casterSpell = new Map();
  const meleeHistory = []; // per melee phase: {nearKills, farKills}
  let lastDress = { attacker: '', defender: '' };

  // ---- own blocks and the line (critique fix 2) ----
  const HOLD = 90; // a block not yet in contact waits this far behind the line: a second line, not the melee
  /**
   * The side's own standing blocks outside the contact, as lateral intervals: `stand`, those whose depth
   * (measured back from the seam) overlaps where block G will stand on the line; `sweep`, those whose
   * depth overlaps anything G covers on its way there (its current depth too), which G must not cross.
   */
  function ownBlocksAtLine(side, G, contactSet, seam, tAt) {
    const stand = [], sweep = [];
    const near0 = LAYOUT.contactGap / 2 - 12, near1 = LAYOUT.contactGap / 2 + G.ext.d + 12;
    const gc = pathAt(G.path, tAt, { x: 0, y: 0, h: 0 });
    const gd0 = G.s * (gc.y - seam), gd1 = gd0 + (G.extTravel || G.ext).d;
    const s0 = Math.min(near0, gd0 - 12), s1 = Math.max(near1, gd1 + 12);
    for (const O of T.G) {
      if (O === G || O.side !== side || contactSet.has(O.idx) || !isBlock(O) || !present(O, tAt) || O.routT !== null || O.onWall) continue;
      if (O.kind === 'cloud') continue;
      const o = pathAt(O.path, tAt + 1.5, { x: 0, y: 0, h: 0 }); // where it will stand once its current step ends
      const d0 = O.s * (o.y - seam), d1 = d0 + O.ext.d;
      const iv = [o.x + O.ext.u0, o.x + O.ext.u1];
      if (!(d1 < near0 || d0 > near1)) stand.push(iv);
      if (!(d1 < s0 || d0 > s1)) sweep.push(iv);
    }
    return { stand, sweep };
  }
  /**
   * The nearest x to the slot x0 (outward first) where the block's frontage, padded by 8 wu, is clear
   * of the `stand` intervals, preferring places it can reach from xCur without sliding through a `sweep` one.
   */
  function freeLateral(x0, ext, stand, xCur, extNow, sweep) {
    const pad = 8, en = extNow || ext, sw = sweep || stand;
    const clear = (x) => stand.every(([a, b]) => x + ext.u1 + pad <= a || x + ext.u0 - pad >= b);
    // swept: the travelling shape (en) from xCur to x, then the final shape (ext) at x
    const reach = (x) => {
      if (xCur === undefined) return true;
      const lo = Math.min(Math.min(x, xCur) + en.u0, x + ext.u0) - pad, hi = Math.max(Math.max(x, xCur) + en.u1, x + ext.u1) + pad;
      return sw.every(([a, b]) => hi <= a || lo >= b);
    };
    const out = x0 >= 0 ? 1 : -1;
    let fallback = null;
    for (let d = 0; d < 3000; d += 2) {
      for (const x of d ? [x0 + out * d, x0 - out * d] : [x0]) {
        if (!clear(x)) continue;
        if (reach(x)) return x;
        if (fallback === null) fallback = x;
      }
    }
    return fallback ?? x0;
  }
  /** Blocks that have never fought step back to HOLD wu behind the line, over dur from tAt. */
  function holdSecondLine(tAt, dur, contactSet) {
    if (T.seamY === null || storm) return;
    for (const O of T.G) {
      if (!isBlock(O) || contactSet.has(O.idx) || O.everContact || O.routT !== null || !present(O, tAt) || O.onWall || O.kind === 'cloud') continue;
      const o = pathAt(O.path, tAt + 2, { x: 0, y: 0, h: 0 });
      if (O.s * (o.y - T.seamY) < HOLD) pathMove(O.path, tAt, dur, o.x, T.seamY + O.s * HOLD, o.h, 'smooth');
    }
  }
  /** Plans a wedge's living riders into two ranks (applied by applyFlatten when the charge lands). */
  function flattenWedge(G, t) {
    const live = liveFigs(G, t);
    if (live.length < 3) return;
    const F = FORM.wedge, files = Math.ceil(live.length / 2);
    const order = live.slice().sort((a, b) => a.rank - b.rank || a.u - b.u);
    G.flat = [];
    const ranks = [order.slice(0, files), order.slice(files)];
    ranks.forEach((row, r) => {
      row.sort((a, b) => a.u - b.u);
      row.forEach((f, i) => {
        const j = u01(T.id + '/flat/' + f.id);
        const u = Math.round(((i - (row.length - 1) / 2) * F.fs + (j * 2 - 1) * F.jit) * 2) / 2;
        const v = Math.round((r * F.rs + (u01(T.id + '/flatv/' + f.id) * 2 - 1) * F.jit) * 2) / 2;
        G.flat.push({ f, u, v, rank: r, file: i + (files - row.length) / 2 });
      });
    });
    G.extTravel = G.ext;
    G.ext = blockExtent(G.flat);
  }
  function applyFlatten(G, t) {
    for (const p of G.flat) { addSeat(p.f, t, p.u, p.v, 0.4); p.f.rank = p.rank; p.f.file = p.file; }
    G.flat = null;
  }

  // ---- deaths, wounds, closing ranks ----
  function closeRanks(G, f, t) {
    if (!isBlock(G)) return;
    const others = liveFigs(G, t + 1e-6).filter((o) => o !== f);
    const behind = others.filter((o) => o.file === f.file && o.rank > f.rank).sort((a, b) => a.rank - b.rank);
    const tStep = t + 0.5;
    if (behind.length) {
      let su = f.u, sv = f.v, sr = f.rank;
      for (const o of behind) {
        const nu = o.u, nv = o.v, nr = o.rank;
        addSeat(o, tStep, su, sv, 0.4);
        o.rank = sr; su = nu; sv = nv; sr = nr;
      }
      return;
    }
    const near2 = others.filter((o) => Math.abs(o.file - f.file) <= 2 && o.rank > f.rank)
      .sort((a, b) => b.rank - a.rank || Math.abs(a.file - f.file) - Math.abs(b.file - f.file));
    if (near2.length) {
      const o = near2[0];
      addSeat(o, tStep, f.u, f.v, 0.5);
      o.rank = f.rank; o.file = f.file;
    }
  }
  function killFigure(f, t, how, blast) {
    if (f.death) return;
    const G = T.G[f.g];
    const g = G.g;
    let at = figPos(T, f, t, { x: 0, y: 0, h: 0 });
    const flyer = at.h > 20;
    let fall = g.size >= 3 ? (flyer ? 1.4 : 1.1) : flyer ? 0.35 : 0.35;
    const rng = u01(T.id + '/death/' + f.id);
    const drop = flyer && (G.kind === 'cloud' || g.flying);
    // stage D pilot: a blast throws a small figure out along the ground and it burns out (33-fx-timeline.js fxThrow)
    const th = blast && g.size < 3 && !flyer ? fxThrow(T, f, t, at, blast.centre, blast.look) : null;
    if (th) { fall = th.fall; at = th.to; }
    f.death = { t, fall, at: { x: at.x, y: at.y, h: at.h }, drop, how, flip: rng < 0.5, rot: (rng * 2 - 1) * 0.35 };
    if (th) { f.death.from = th.from; f.death.hop = th.hop; }
    if (blast) f.death.fire = true;
    f.alive = false;
    T.deathsAll.push({ t, f: f.id, g: f.g });
    const corpse = !(g.unit === 'fireSprite' || g.unit === 'hornetSwarm');
    const hd = drop ? 0 : at.h;
    T.decals.push({ t: t + fall, kind: corpse ? 'body' : g.unit === 'fireSprite' ? 'scorch' : 'specks', f: f.id, x: at.x, y: at.y, h: hd,
      flip: f.death.flip, rot: f.death.rot, big: g.size >= 3, char: !!blast });
    if (corpse && g.unit !== 'treant' && !blast) T.decals.push({ t: t + fall * 0.6, kind: 'pool', x: at.x + 2, y: at.y - 1, h: hd, r: g.size >= 3 ? 26 : 5 + rng * 4, grow: 1.2 });
    closeRanks(G, f, t);
  }
  function wound(f, t, hpAfter) {
    const w = clamp(1 - hpAfter / Math.max(1, f.maxHp), 0, 1);
    f.wounds.push({ t, w });
    f.marked = true;
  }
  function burst(t, x, y, h, kind, n, item) { T.bursts.push({ t, x, y, h, kind, n, key: hash32(T.id + '/b/' + T.bursts.length), item: item || null }); }

  // ---- commander HP track (exact from landings) ----
  for (const g of S.groups) if (g.isCmd) T.cmdHp[g.idx] = [{ t: -1e9, hp: g.hp }];
  function cmdHit(gi, t, dealt) {
    const arr = T.cmdHp[gi];
    if (!arr) return;
    const hp = Math.max(0, arr[arr.length - 1].hp - dealt);
    arr.push({ t, hp });
  }

  // ---- beats and ticker (S2.7 beat weights) ----
  function beat(t, text, weight, kind) { T.beats.push({ t, text, weight, kind: kind || 'beat' }); }
  function camKey(t, figs, pad, hold) {
    T.camera.push({ t, figs: figs.slice(0, 400), pad: pad || 0.15, hold: hold || 0 });
  }

  // the context the phases (31a to 31c) read: the build's state and helpers
  const C = { S, L, T, B, tmp, groupOf, near, sideSign, isBlock, aliveAt, present, liveFigs, figOf, storm, defenderSide, W, spellCount, casterSpell,
    firstContactDone: false, meleeHistory, lastDress, HOLD, ownBlocksAtLine, freeLateral, holdSecondLine, flattenWedge, applyFlatten, closeRanks,
    killFigure, wound, burst, cmdHit, beat, camKey };
  for (const n of ['climbTheWall', 'scriptsPhase', 'rankItems', 'rangedPhase', 'landing', 'frontageOf', 'meleePhase', 'moralePhase', 'routGroup', 'endPhase', 'deathSequences']) C[n] = (...a) => TL_PHASES[n](C, ...a);
  const { climbTheWall, scriptsPhase, rankItems, rangedPhase, landing, frontageOf, meleePhase, moralePhase, routGroup, endPhase, deathSequences } = C;

  // ---- the stage at t = 0 ----
  let t = 0;
  // intro: blocks step the last 30 wu into place (design section 10)
  for (const G of T.G) {
    if (G.appear !== -Infinity) continue;
    const p0 = G.path[0];
    const yBack = p0.y0 + G.s * 30;
    G.path[0] = { ...p0, y0: yBack, y1: yBack };
    pathMove(G.path, 0.5 + 0.3 * u01(T.id + '/intro/' + G.idx), 1.6, p0.x1, p0.y1, p0.h1, 'smooth');
  }
  if (storm) {
    // the fort wall at the seam: outer face on the centre line, defenders on the walk
    const face = 0;
    T.wall = { face, h: W.wallH, walk: W.walk, x0: L.field.x0 - 200, x1: L.field.x1 + 200, defSign: sideSign(defenderSide),
      gate: { x: L.field.x1 + 135, w: 90 } }; // the gatehouse stands beyond the field's lateral end
    T.seamY = face;
    for (const G of T.G) {
      if (G.side !== defenderSide || G.appear !== -Infinity) continue;
      const row = G.g.row;
      if (G.kind === 'commander') continue;
      const s = G.s;
      let y, h;
      if (row === 'front') { y = face + s * 10; h = W.wallH; }
      else if (row === 'middle') { y = face + s * (W.walk + 12); h = W.wallH * 0.62; }
      else continue;
      for (const seg of G.path) { seg.y0 = y + (seg === G.path[0] ? s * 30 : 0); seg.y1 = y; seg.h0 = h; seg.h1 = h; }
      G.path[0].y0 = y; G.path[0].y1 = y; // defenders are already on the wall
      G.onWall = row;
    }
  }
  beat(0.4, `${B.sides.attacker.name} ${storm ? 'storms the fort of' : 'attacks'} ${B.sides.defender.name} at ${B.province}`, 2, 'intro');
  T.segments.push({ t0: 0, t1: 3.0, label: 'Intro', kind: 'intro' });
  camKey(0, T.F.filter((f) => T.G[f.g].appear === -Infinity).map((f) => f.id), 0.1, 3.0);
  t = 3.0;

  // ---- rounds ----
  for (const r of S.rounds) {
    const rStart = t;
    T.rounds.push({ round: r.round, t });
    // closing steps at the round start (design section 6, Closing)
    for (const G of T.G) {
      if (!present(G, t) || G.inContact || G.routT !== null || G.onWall) continue;
      if (G.kind === 'commander' || G.g.ranged) continue;
      if (G.g.row !== 'front' && G.kind !== 'body') continue;
      if (G.kind === 'body' && !G.advanced) continue;
      if (r.round >= G.closing) continue;
      const sp = G.g.flying ? 3 : clamp(G.g.speed, 1, 3);
      const step = LAYOUT.closingStep[sp];
      const cur = pathAt(G.path, t, tmp);
      const limit = 34; // stay this far from the centre line until contact
      let ny = cur.y - G.s * step;
      if (Math.abs(ny) < limit) ny = G.s * limit;
      // once the lines have met, a block outside the contact halts HOLD wu short of the line
      if (T.seamY !== null && G.s * (ny - T.seamY) < HOLD) ny = T.seamY + G.s * HOLD;
      // never step into the side's own blocks already fighting at the line (critique fix 2)
      const half = G.kind === 'body' ? LAYOUT.footR[G.g.size] : 0;
      const gx0 = cur.x + (G.kind === 'body' ? -half : G.ext.u0) - 6, gx1 = cur.x + (G.kind === 'body' ? half : G.ext.u1) + 6;
      for (const O of T.G) {
        if (O === G || O.side !== G.side || !O.inContact || !isBlock(O) || O.routT !== null || !present(O, t)) continue;
        const o = pathAt(O.path, t + 1.1, { x: 0, y: 0, h: 0 });
        if (o.x + O.ext.u1 < gx0 || o.x + O.ext.u0 > gx1) continue;
        const behind = G.s * o.y + O.ext.d + 12 + half;
        if (G.s * ny < behind) ny = G.s * behind;
      }
      if (G.s * ny > G.s * cur.y) ny = cur.y; // a closing step never steps back
      if (Math.abs(ny - cur.y) > 1) pathMove(G.path, t + 0.1, 1.0, cur.x, ny, cur.h, 'smooth');
    }
    t += 0.3;
    for (const p of r.phases) {
      const t0 = t;
      let dur = 0;
      if (p.kind === 'scripts') dur = scriptsPhase(p, t);
      else if (p.kind === 'ranged') dur = rangedPhase(p, t);
      else if (p.kind === 'melee') dur = meleePhase(p, t, r);
      else if (p.kind === 'morale') dur = moralePhase(p, t);
      else if (p.kind === 'end') dur = endPhase(p, t);
      if (p.leaves.length) dur = Math.max(dur, 0.4);
      for (const gi of p.leaves) {
        const G = T.G[gi];
        if (!G) continue;
        if (G.routT === null) routGroup(G, t0); // the round-50 withdrawal (march off)
        G.leaveT = t0 + Math.min(0.35, dur - 0.03);
        for (const fi of G.figs) { const f = T.F[fi]; if (f.rout) f.rout.tLeave = t0 - 0.2; }
      }
      t += dur;
      if (dur > 0) T.segments.push({ t0, t1: t, label: `Round ${r.round} · ${p.kind}`, kind: p.kind, round: r.round });
      t += deathSequences(p, t);
      T.phaseEnds.push({ t: t - 1e-3, fold: p.fold, round: r.round, phase: p.kind });
    }
    T.rounds[T.rounds.length - 1].t1 = t;
    void rStart;
  }
  // outro
  const winner = B.winner;
  if (storm && winner === 'attacker') climbTheWall(t);
  beat(t + 0.2, `${B.sides[winner].name} ${winner === 'attacker' ? 'take' : 'hold'} ${B.province}`, 20, 'end');
  T.segments.push({ t0: t, t1: t + 2.5, label: 'Outro', kind: 'outro' });
  camKey(t, T.F.filter((f) => !f.death && (T.G[f.g].leaveT === null)).map((f) => f.id), 0.12, 2.5);
  T.resultAt = t + 2.5;
  t += 2.5;
  T.duration = t;
  finishTimeline(T);
  return T;

  // =====================================================================================
  /** A won storm ends on the wall: the front two ranks of each attacker block at the foot climb onto the walk. */









}

/** A breath shows in its nation's color (display only, docs/05): flame for the Cinder Horde, a green-gold blight for Thornwood. */
function breathColor(g, B) { const n = B.sides[g.side].def; return n === 'thornwood' ? 0x9fd860 : 0xff8a2a; }
