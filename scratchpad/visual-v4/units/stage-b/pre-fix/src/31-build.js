'use strict';
// ---- buildTimeline: pacing (S2.7), choreography (design section 6), sampling (section 5) ----

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
  let firstContactDone = false;
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
  function killFigure(f, t, how) {
    if (f.death) return;
    const G = T.G[f.g];
    const g = G.g;
    const at = figPos(T, f, t, { x: 0, y: 0, h: 0 });
    const flyer = at.h > 20;
    const fall = g.size >= 3 ? (flyer ? 1.4 : 1.1) : flyer ? 0.35 : 0.35;
    const rng = u01(T.id + '/death/' + f.id);
    const drop = flyer && (G.kind === 'cloud' || g.flying);
    f.death = { t, fall, at: { x: at.x, y: at.y, h: at.h }, drop, how, flip: rng < 0.5, rot: (rng * 2 - 1) * 0.35 };
    f.alive = false;
    T.deathsAll.push({ t, f: f.id, g: f.g });
    const corpse = !(g.unit === 'fireSprite' || g.unit === 'hornetSwarm');
    const hd = drop ? 0 : at.h;
    T.decals.push({ t: t + fall, kind: corpse ? 'body' : g.unit === 'fireSprite' ? 'scorch' : 'specks', f: f.id, x: at.x, y: at.y, h: hd,
      flip: f.death.flip, rot: f.death.rot, big: g.size >= 3 });
    if (corpse && g.unit !== 'treant') T.decals.push({ t: t + fall * 0.6, kind: 'pool', x: at.x + 2, y: at.y - 1, h: hd, r: g.size >= 3 ? 26 : 5 + rng * 4, grow: 1.2 });
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
  function climbTheWall(t0) {
    for (const G of T.G) {
      if (G.side === defenderSide || !isBlock(G) || !G.everContact || G.routT !== null || G.leaveT !== null || G.kind === 'cloud') continue;
      if ((G.g.tags || []).includes('mounted') || G.kind === 'pack') continue; // riders and beasts stay below
      for (const f of liveFigs(G, t0)) {
        if (f.rank > 1) continue;
        // the front rank goes first and deepest; the second follows a file at a time, so no two cross
        const tc = t0 + 0.2 + 0.4 * u01(T.id + '/climb/' + G.idx + '/' + Math.round(f.file * 2)) + 0.95 * f.rank;
        f.climb = { t: tc, dur: 0.9 };
        addSeat(f, tc, f.u, -(LAYOUT.contactGap + 9 + 12 * (1 - f.rank)), 0.9);
      }
    }
  }

  // =====================================================================================
  function scriptsPhase(p, t0) {
    let tc = t0, end = t0, lastImpact = t0;
    // advances: the commander or body moves to the current front band (0.8 s, parallel)
    for (const a of p.advances) {
      const G = T.G[a.unit];
      G.advanced = true;
      const bands = L.bands[G.side];
      const s = G.s;
      const cur = pathAt(G.path, t0, tmp);
      if (G.kind === 'body') {
        const fr = LAYOUT.footR[G.g.size];
        const x = Math.min(bands.front.left, bands.middle.left || 0) - LAYOUT.slotGap - fr * 2;
        pathMove(G.path, t0, G.g.flying ? 1.2 : 1.6, x, s * (bands.front.start + fr), G.g.flying ? 40 : 0, 'smooth');
      } else {
        pathMove(G.path, t0, 0.8, bands.front.right + 40, s * (bands.front.start + 10), 0, 'smooth');
      }
      end = Math.max(end, t0 + 0.8);
      void cur;
    }
    const nCast = p.casts.length;
    p.casts.forEach((c, k) => {
      const ci = c.i;
      const nextI = k + 1 < nCast ? p.casts[k + 1].i : Infinity;
      const hits = p.blows.filter((b) => b.src === 'spell' && b.att === c.caster && b.at > ci && b.at <= nextI);
      const look = SPELL_LOOK[c.spellId] || { color: 0xffffff, travel: 0.3, kind: 'bolt', level: 1 };
      const n = (spellCount.get(c.spellId) || 0) + 1; spellCount.set(c.spellId, n);
      const cs = c.caster + '/' + c.spellId;
      const nc = (casterSpell.get(cs) || 0) + 1; casterSpell.set(cs, nc);
      const kills = hits.filter((h) => h.outcome === 'kill').length;
      let form = n === 1 ? 'full' : 'short';
      if (nc >= 3 && look.level < 3 && kills < 3) form = 'brief';
      let charge = form === 'full' ? 0.6 : form === 'short' ? 0.35 : 0.2;
      let travel = form === 'brief' ? Math.min(0.2, look.travel) : look.travel;
      if (tc - t0 > 5.0) { charge = 0.15; travel = Math.min(travel, 0.15); }
      const start = tc, release = start + charge;
      const impact = Math.max(release + travel, lastImpact + 0.08);
      lastImpact = impact;
      tc = release;
      const casterF = figOf(c.caster, 0);
      const targets = c.targets.filter((gi) => T.G[gi]);
      T.spellFx.push({ spell: c.spellId, look, form, fatigue: c.fatigue, t0: start, release, impact, t1: impact + 0.7, caster: casterF.id, cg: c.caster,
        targets, hitFigs: hits.map((h) => figOf(h.tgt, h.tm).id) });
      casterF.shots.push({ t: start, tRel: release, kind: 'cast', item: null });
      // hits land at impact, spread a little
      hits.forEach((h, j) => {
        const th = impact + (look.kind === 'meteors' ? 0.6 * (j / Math.max(1, hits.length)) : 0.04 * (j % 5));
        const f = figOf(h.tgt, h.tm);
        if (groupOf(h.tgt).isCmd) cmdHit(h.tgt, th, h.dealt);
        if (h.outcome === 'kill') { killFigure(f, th, 'spell:' + c.spellId); burst(th, 0, 0, 0, 'fire', 10, null); T.bursts[T.bursts.length - 1].f = f.id; }
        else if (h.outcome === 'wound') { wound(f, th, h.hpBefore - h.dealt); f.reacts.push({ t: th, kind: 'wound', item: null }); }
        else f.reacts.push({ t: th, kind: 'blocked', item: null });
      });
      // buffs from this cast: rings under the target blocks until they expire
      const evs = p.events.filter((e) => e.i > ci && e.i < nextI);
      for (const e of evs) {
        if (e.kind === 'buff') T.rings.push({ g: e.target, t0: impact, t1: Infinity, color: look.color, debuff: e.debuff, source: e.source, stat: e.stat, delta: e.delta });
        if (e.kind === 'summon') {
          const G = T.G[e.squad];
          if (G) {
            G.appear = impact;
            T.summonsAt.push({ g: e.squad, t: impact });
            beat(impact, `${displayName(groupOf(c.caster))} calls ${plural(groupOf(e.squad))}`, 7, 'summon');
          }
        }
      }
      const caster = groupOf(c.caster);
      const tgtNames = targets.slice(0, 2).map((gi) => displayName(groupOf(gi))).join(' and ');
      const text = `${displayName(caster)}: ${SPELL_NAMES[c.spellId] || c.spellId}` + (kills ? ` · ${kills} slain` : tgtNames ? ` on ${tgtNames}` : '');
      if (look.level >= 3 || kills >= 3) beat(impact, text, 6, 'spell'); else T.ticker.push({ t: impact, text });
      camKey(start, [casterF.id, ...targets.flatMap((gi) => T.G[gi].figs.slice(0, 40))], 0.15);
      end = Math.max(end, impact + (form === 'brief' ? 0.25 : 0.55));
    });
    if (p.summons.length && !nCast) end = Math.max(end, t0 + 1.2);
    const dur = Math.max(0, end - t0);
    return p.casts.length || p.advances.length || p.summons.length ? Math.max(dur, 0.6) : 0;
  }

  // =====================================================================================
  function rankItems(p, items, kind) {
    // mandatory: commanders / big bodies involved, kills (ranged), charge first impacts
    const ph = { kind, nMand: 0, coverage: 0 };
    const mand = [], rest = [];
    for (const it of items) {
      it.ph = ph;
      const b = it.b;
      const tg = groupOf(b.tgt), ag = groupOf(b.att);
      const big = tg.isCmd || tg.big || ag.big;
      if ((kind === 'ranged' && b.outcome === 'kill') || (big && (b.outcome !== 'miss' || ag.big)) || it.charge) { it.mand = true; mand.push(it); }
      else rest.push(it);
    }
    // featured strikes (melee): up to 6, duels only, by score
    if (kind === 'melee') {
      const lastKill = new Map();
      rest.forEach((it) => { if (it.b.outcome === 'kill') lastKill.set(it.b.tgt, it); });
      let maxDealt = null;
      rest.forEach((it) => { if (it.b.outcome === 'kill' && (!maxDealt || it.b.dealt > maxDealt.b.dealt)) maxDealt = it; });
      const scored = rest.filter((it) => it.duel).map((it) => {
        let sc = 0;
        if (it.b.outcome === 'kill') {
          if (it === maxDealt) sc += 2;
          if (it.b.rolls && it.b.rolls.attackDrn >= 18) sc += 2;
          sc += 1;
        }
        return { it, sc };
      }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc || hash32(a.it.key) - hash32(b.it.key));
      const usedAtt = new Set();
      for (const { it } of scored) {
        if (mand.filter((m) => m.featured).length >= 6) break;
        const ak = it.b.att + '/' + it.b.am;
        if (usedAtt.has(ak)) continue;
        usedAtt.add(ak); it.mand = true; it.featured = true; mand.push(it);
      }
    }
    const ranked = rest.filter((it) => !it.mand);
    // coverage: one per engaged pair with no mandatory item, pairs by attacks descending
    const pairs = new Map();
    for (const it of items) {
      const k = it.b.att + '>' + it.b.tgt;
      if (!pairs.has(k)) pairs.set(k, { k, items: [], mand: 0 });
      const pr = pairs.get(k);
      if (it.mand) pr.mand++; else pr.items.push(it);
    }
    const order = [];
    const plist = [...pairs.values()].sort((a, b) => (b.items.length + b.mand) - (a.items.length + a.mand) || (a.k < b.k ? -1 : 1));
    const cls = (it) => it.b.outcome;
    for (const pr of plist) {
      // within a pair: classes interleaved by Sainte-Lague on class counts; within a class by dealt then hash
      const byClass = new Map();
      for (const it of pr.items) { const c = cls(it); if (!byClass.has(c)) byClass.set(c, []); byClass.get(c).push(it); }
      for (const arr of byClass.values()) arr.sort((a, b) => b.b.dealt - a.b.dealt || hash32(a.key) - hash32(b.key));
      const seq = [];
      const taken = new Map();
      const total = pr.items.length;
      for (let i = 0; i < total; i++) {
        let best = null, bestV = Infinity;
        for (const [c, arr] of byClass) {
          const tk = taken.get(c) || 0;
          if (tk >= arr.length) continue;
          const v = (tk + 0.5) / arr.length;
          if (v < bestV) { bestV = v; best = c; }
        }
        const tk = taken.get(best) || 0;
        seq.push(byClass.get(best)[tk]); taken.set(best, tk + 1);
      }
      pr.seq = seq; pr.taken = 0;
    }
    let coverage = 0;
    for (const pr of plist) if (pr.mand === 0 && pr.seq.length) { order.push(pr.seq[0]); pr.taken = 1; coverage++; }
    // then pairs by Sainte-Lague on attacks
    let left = ranked.length - order.length;
    while (left > 0) {
      let best = null, bestV = Infinity;
      for (const pr of plist) {
        if (pr.taken >= pr.seq.length) continue;
        const v = (pr.taken + 0.5) / (pr.seq.length + pr.mand);
        if (v < bestV) { bestV = v; best = pr; }
      }
      if (!best) break;
      order.push(best.seq[best.taken++]); left--;
    }
    order.forEach((it, i) => { it.rank = i; });
    for (const it of mand) it.rank = -1;
    ph.nMand = mand.length; ph.coverage = coverage;
    return ph;
  }

  // =====================================================================================
  function rangedPhase(p, t0) {
    const shots = p.blows.filter((b) => b.src === 'melee' || b.src === 'ranged').filter((b) => b.phase === 'ranged');
    if (!shots.length) return 0;
    const items = shots.map((b) => ({ b, key: b.key, kind: 'shot' }));
    rankItems(p, items, 'ranged');
    const breathers = new Map();
    const shooters = new Set();
    for (const it of items) {
      const b = it.b;
      const sf = figOf(b.att, b.am), tf = figOf(b.tgt, b.tm);
      const wl = RANGED[b.wname] || RANGED.Shortbow;
      shooters.add(b.att);
      if (wl.kind === 'breath') {
        if (!breathers.has(b.att)) breathers.set(b.att, []);
        breathers.get(b.att).push(it);
        continue;
      }
      const u = u01(T.id + '/rel/' + b.att + '/' + b.am + '/' + p.round);
      const release = t0 + 0.35 + 0.25 * u;
      const a = figPos(T, sf, release, { x: 0, y: 0, h: 0 }), c = figPos(T, tf, release, { x: 0, y: 0, h: 0 });
      const dist = Math.hypot(a.x - c.x, a.y - c.y);
      const flight = wl.flight + Math.max(0, dist - 400) / 1000;
      const land = Math.min(release + flight, t0 + 1.62);
      const ang = u01(it.key + '/miss') * TAU, md = 10 + 30 * u01(it.key + '/md');
      const proj = { t0: release, t1: land, from: sf.id, to: tf.id, kind: wl.kind, apex: wl.apex, outcome: b.outcome, item: it,
        miss: { dx: Math.cos(ang) * md, dy: Math.sin(ang) * md * 0.8 } };
      T.projectiles.push(proj);
      sf.shots.push({ t: release - 0.35, tRel: release, kind: 'shoot', item: it });
      landing(b, tf, land, it, wl.kind);
    }
    // breath: rear up 0.3 s, then a stream that sweeps the struck row over 0.6 s
    for (const [gi, its] of breathers) {
      const sf = figOf(gi, 0);
      const tw = t0 + 0.3, ts = tw + 0.3, te = ts + 0.7;
      const hitFigs = its.map((it) => figOf(it.b.tgt, it.b.tm).id);
      T.spellFx.push({ spell: 'breath', look: { color: breathColor(groupOf(gi), B) },
        t0: tw, release: ts, impact: ts, t1: te, caster: sf.id, cg: gi, targets: [...new Set(its.map((it) => it.b.tgt))], hitFigs });
      sf.shots.push({ t: tw, tRel: ts, kind: 'breath', item: null, dur: te - tw });
      its.forEach((it, j) => {
        const tl = ts + 0.08 + 0.55 * (j / Math.max(1, its.length));
        const hf = figOf(it.b.tgt, it.b.tm);
        const hp = figPos(T, hf, ts, { x: 0, y: 0, h: 0 });
        // the sweep leaves a burnt track (not a death mark: it is drawn for misses too)
        T.decals.push({ t: te, kind: 'burnt', x: hp.x + (u01(it.key + '/bx') - 0.5) * 8, y: hp.y + (u01(it.key + '/by') - 0.5) * 6, h: 0, s: 0.8 + 0.5 * u01(it.key + '/bs') });
        landing(it.b, hf, tl, it, 'breath');
      });
      const g = groupOf(gi);
      const k = its.filter((it) => it.b.outcome === 'kill').length;
      beat(ts, `${displayName(g)} breathes fire` + (k ? ` · ${k} slain` : ''), 8, 'monster');
    }
    for (const gi of shooters) {
      const G = T.G[gi];
      G.volleys = (G.volleys || 0) + 1;
      (G.volleyTimes || (G.volleyTimes = [])).push(t0 + 0.6);
      const ammo = Math.max(0, ...groupOf(gi).weapons.filter((w) => w.range > 0).map((w) => w.ammo));
      if (G.volleys >= ammo) G.ammoOut = true;
    }
    const sh = [...shooters];
    camKey(t0, [...sh.flatMap((gi) => T.G[gi].figs.slice(0, 30)), ...shots.slice(0, 60).map((b) => figOf(b.tgt, b.tm).id)], 0.15);
    const vol = sh.filter((gi) => !breathers.has(gi)).map((gi) => groupOf(gi));
    if (vol.length) {
      const kills = shots.filter((b) => b.outcome === 'kill').length;
      T.ticker.push({ t: t0 + 0.6, text: `${vol.map(displayName).slice(0, 2).join(' and ')} loose` + (kills ? ` · ${kills} slain` : '') });
    }
    return 1.7;
  }

  function landing(b, tf, tl, it, pkind) {
    const tg = groupOf(b.tgt);
    if (tg.isCmd) cmdHit(b.tgt, tl, b.dealt);
    const o = b.outcome;
    if (o === 'kill') { killFigure(tf, tl, pkind); tf.reacts.push({ t: tl, kind: 'kill', item: it }); burst(tl, 0, 0, 0, pkind === 'breath' ? 'fire' : 'blood', pkind === 'breath' ? 12 : 10, null); T.bursts[T.bursts.length - 1].f = tf.id; }
    else if (o === 'wound') { wound(tf, tl, b.hpBefore - b.dealt); tf.reacts.push({ t: tl, kind: 'wound', item: it }); burst(tl, 0, 0, 0, pkind === 'breath' ? 'fire' : 'blood', 5, it); T.bursts[T.bursts.length - 1].f = tf.id; }
    else if (o === 'blocked') { tf.reacts.push({ t: tl, kind: 'blocked', item: it }); burst(tl, 0, 0, 0, 'spark', 4, it); T.bursts[T.bursts.length - 1].f = tf.id; }
    else if (o === 'onFallen') { /* the shaft sticks in the body */ }
    else if (pkind !== 'breath') T.decals.push({ t: tl, kind: 'stub', proj: T.projectiles.length - 1, item: it });
  }

  // =====================================================================================
  function frontageOf(G, t) {
    const o = pathAt(G.path, t, { x: 0, y: 0, h: 0 });
    return { x0: o.x + G.ext.u0 - 6, x1: o.x + G.ext.u1 + 6, x: o.x, y: o.y };
  }

  function meleePhase(p, t0, r) {
    const blows = p.blows.filter((b) => b.phase === 'melee' && (b.src === 'melee' || b.src === 'ranged'));
    const burns = p.blows.filter((b) => b.src === 'burn');
    const contact = (p.engage ? p.engage.contact : []).filter((gi) => T.G[gi] && present(T.G[gi], t0));
    if (!blows.length && !contact.length) return 0;
    const first = !firstContactDone;
    firstContactDone = true;
    const kills = blows.filter((b) => b.outcome === 'kill').length;
    let Wd = first ? 4.0 : Math.min(4.8, 2.4 + Math.max(0, kills - 20) / 10 * 0.25);
    // ---- who stands at the seam ----
    const bySide = { attacker: [], defender: [] };
    for (const gi of contact) bySide[T.G[gi].side].push(T.G[gi]);
    const newly = contact.map((gi) => T.G[gi]).filter((G) => !G.inContact);
    const blocks = (side) => bySide[side].filter((G) => isBlock(G) && G.routT === null);
    const closer = (G) => !G.g.ranged || G.ammoOut;
    const nearS = near, farS = near === 'attacker' ? 'defender' : 'attacker';
    let seam = T.seamY;
    if (!storm) {
      const nb = blocks(nearS), fb = blocks(farS);
      const yN = nb.length ? Math.max(...nb.map((G) => pathAt(G.path, t0, tmp).y)) : null;
      const yF = fb.length ? Math.min(...fb.map((G) => pathAt(G.path, t0, tmp).y)) : null;
      const newN = nb.filter((G) => !G.inContact), newF = fb.filter((G) => !G.inContact);
      const holdF = newF.length && newF.every((G) => !closer(G)), holdN = newN.length && newN.every((G) => !closer(G));
      if (seam === null) {
        if (yN !== null && yF !== null) {
          if (holdF && !holdN) seam = yF - LAYOUT.contactGap / 2;
          else if (holdN && !holdF) seam = yN + LAYOUT.contactGap / 2;
          else seam = (yN + yF) / 2;
        } else seam = 0;
      } else {
        if (holdF && yF !== null) seam = Math.min(...newF.map((G) => pathAt(G.path, t0, tmp).y)) - LAYOUT.contactGap / 2;
        else if (holdN && yN !== null) seam = Math.max(...newN.map((G) => pathAt(G.path, t0, tmp).y)) + LAYOUT.contactGap / 2;
        else if (newF.length && yF !== null && yF - seam > 30) seam = (seam + yF) / 2; // advance into an emptied band
        else if (newN.length && yN !== null && seam - yN > 30) seam = (seam + yN) / 2;
      }
      T.seamY = seam;
    }
    // ---- contact charge and dressing the line ----
    let maxDur = 0;
    const contactSet = new Set(contact);
    holdSecondLine(t0, 0.7, contactSet); // blocks not in this fight wait behind the line
    for (const side of [nearS, farS]) {
      const bl = blocks(side);
      const sig = bl.map((G) => G.idx).sort().join(',');
      const dress = sig !== lastDress[side] && bl.length > 0 && !(storm && side === defenderSide);
      lastDress[side] = sig;
      // a wedge that reaches contact flattens to two ranks, so its point hits the line (critique fix 2)
      for (const G of bl) if (!G.inContact && G.kind === 'wedge') flattenWedge(G, t0);
      // lateral order kept, gaps closed to 8 wu, centred on x = 0
      const sorted = bl.slice().sort((a, b) => pathAt(a.path, t0, tmp).x - pathAt(b.path, t0, tmp).x);
      const widths = sorted.map((G) => G.ext.w + 12);
      const total = widths.reduce((a, b) => a + b, 0) + LAYOUT.slotGapEngaged * Math.max(0, sorted.length - 1);
      let xc = -total / 2;
      const taken = [];
      // one duration and one ease for the whole side, so dressing blocks never slide through each other
      const anyNew = sorted.some((G) => !G.inContact);
      const dSide = Math.max(0.6, ...sorted.map((G) => (!G.inContact ? LAYOUT.contactDur[G.g.flying ? 3 : clamp(G.g.speed, 1, 3)] : 0.6)));
      sorted.forEach((G, k) => {
        const cur = pathAt(G.path, t0, { x: 0, y: 0, h: 0 });
        let nx = dress ? xc + widths[k] / 2 - (G.ext.u0 + G.ext.u1) / 2 : cur.x;
        xc += widths[k] + LAYOUT.slotGapEngaged;
        // never dress onto the side's own blocks that stand at the line but are not in this contact
        if (!(storm && side === defenderSide)) {
          const obs = ownBlocksAtLine(side, G, contactSet, seam, t0);
          nx = freeLateral(nx, G.ext, [...obs.stand, ...taken], cur.x, G.flat ? G.extTravel : G.ext, [...obs.sweep, ...taken]);
          taken.push([nx + G.ext.u0 - LAYOUT.slotGapEngaged / 2, nx + G.ext.u1 + LAYOUT.slotGapEngaged / 2]);
        }
        let ny = seam + G.s * LAYOUT.contactGap / 2, nh = cur.h;
        if (storm && side === defenderSide) { ny = cur.y; }
        if (storm && side !== defenderSide) ny = seam + G.s * 9;
        const d = dSide;
        if (Math.abs(nx - cur.x) > 0.5 || Math.abs(ny - cur.y) > 0.5) {
          pathMove(G.path, t0, d, nx, ny, nh, anyNew ? 'in' : 'smooth');
          maxDur = Math.max(maxDur, d);
        }
        if (G.flat) applyFlatten(G, t0 + Math.max(0, d - 0.3)); // the point spreads into the line as it lands
        if (!G.inContact && (G.g.tags || []).includes('mounted')) T.charges.push({ g: G.idx, t: t0 + d });
      });
    }
    for (const G of contact.map((gi) => T.G[gi])) {
      G.inContact = true; G.everContact = true;
      if (G.contactT === undefined) { G.contactT = t0; G.inContactAt = (tt) => tt >= G.contactT && (G.routT === null || tt < G.routT); }
    }
    const ws = t0 + (newly.length ? Math.max(0.15, maxDur * 0.9) : 0.15);
    const we = t0 + Wd * 0.95;
    // ---- touching pairs ----
    const touch = (A, Tg) => {
      if (!isBlock(A) || !isBlock(Tg)) return true; // free movers walk to their foes
      const a = frontageOf(A, ws), b = frontageOf(Tg, ws);
      const gap = Math.max(a.x0 - b.x1, b.x0 - a.x1);
      return gap <= 36;
    };
    // ---- items and ranks ----
    const items = blows.map((b) => {
      const A = T.G[b.att], Tg = T.G[b.tgt];
      const ag = groupOf(b.att);
      const isCharge = !A.charged && (ag.tags || []).includes('mounted') && b.first && b.outcome !== 'miss';
      if (isCharge) A.charged = true;
      return { b, key: b.key, duel: touch(A, Tg) && Tg.routT === null, charge: isCharge };
    });
    rankItems(p, items, 'melee');
    // ---- times: hashed over the window, ordered per target member, strike rate per attacker ----
    for (const it of items) it.t = ws + u01(it.key + '/t') * (we - ws);
    const byAtt = new Map();
    for (const it of items.slice().sort((a, b) => a.t - b.t)) {
      const k = it.b.att + '/' + it.b.am;
      const last = byAtt.get(k);
      if (last !== undefined && it.t - last < 0.45) it.t = Math.min(we, last + 0.45);
      byAtt.set(k, it.t);
    }
    const byTgt = new Map();
    for (const it of items) { const k = it.b.tgt + '/' + it.b.tm; if (!byTgt.has(k)) byTgt.set(k, []); byTgt.get(k).push(it); }
    for (const arr of byTgt.values()) {
      const times = arr.map((it) => it.t).sort((a, b) => a - b);
      arr.sort((a, b) => a.b.seq - b.b.seq).forEach((it, i) => { it.t = times[i]; });
    }
    // ---- binding (design 4.3): dying and struck members onto front seats near the contact ----
    const committed = new Set();
    const swap = (G, fA, fB) => {
      const mA = fA.member, mB = fB.member;
      G.memberFig[mA] = fB.id; G.memberFig[mB] = fA.id; fA.member = mB; fB.member = mA;
    };
    const bindTo = (gi, m, cx, tAt) => {
      const G = T.G[gi];
      if (!isBlock(G) || G.routT !== null) return;
      const cur = T.F[G.memberFig[m]];
      if (!cur || cur.marked || committed.has(cur.id)) { if (cur) committed.add(cur.id); return; }
      let best = null, bv = Infinity;
      for (const fi of G.figs) {
        const f = T.F[fi];
        if (!aliveAt(f, tAt) || f.marked || committed.has(f.id)) continue;
        const pos = figPos(T, f, ws, tmp);
        const v = f.rank * 1000 + Math.abs(pos.x - cx);
        if (v < bv) { bv = v; best = f; }
      }
      if (best && best !== cur) swap(G, cur, best);
      committed.add((best || cur).id);
    };
    const sortedItems = items.slice().sort((a, b) => a.t - b.t);
    // ---- free movers: commanders and bodies walk (or fly) to their foes ----
    const movers = new Map();
    for (const it of sortedItems) {
      for (const [gi, foe] of [[it.b.att, it.b.tgt], [it.b.tgt, it.b.att]]) {
        const G = T.G[gi];
        if (isBlock(G) || movers.has(gi)) continue;
        movers.set(gi, { it, foe });
      }
    }
    // big bodies fight from the end of their own side's line, on the ground (critique fix 1): outside
    // the union of the side's engaged frontages (and its blocks at the line), at the end nearer the foe
    const bigSpot = new Map();
    for (const [gi, { foe }] of movers) {
      const G = T.G[gi];
      if (G.g.size < 3 || G.routT !== null) continue;
      const fr = LAYOUT.footR[G.g.size];
      const tPlan = t0 + 1.5; // where the dressed line stands
      const ivs = [];
      for (const O of T.G) {
        if (O.side !== G.side || !isBlock(O) || O.routT !== null || !present(O, t0) || O.kind === 'cloud') continue;
        const o = pathAt(O.path, tPlan, { x: 0, y: 0, h: 0 });
        const d0 = O.s * (o.y - (T.seamY ?? 0));
        if (!contactSet.has(O.idx) && d0 > 2 * fr + 40) continue;
        ivs.push([o.x + O.ext.u0, o.x + O.ext.u1]);
      }
      for (const [, sp] of bigSpot) if (sp.side === G.side) ivs.push([sp.x - sp.fr * 1.6, sp.x + sp.fr * 1.6]);
      const FG = T.G[foe];
      const ff = isBlock(FG) ? frontageOf(FG, tPlan) : (() => { const o = pathAt(FG.path, tPlan, { x: 0, y: 0, h: 0 }); return { x0: o.x - 8, x1: o.x + 8, x: o.x }; })();
      const fpx = (ff.x0 + ff.x1) / 2;
      let x;
      if (!ivs.length) x = fpx;
      else {
        const x0 = Math.min(...ivs.map((v) => v[0])), x1 = Math.max(...ivs.map((v) => v[1])), mid = (x0 + x1) / 2;
        const clear = Math.max(1.3 * fr, LAYOUT.bodyReach[G.g.unit] || 0);
        if (fpx < mid) { x = x0 - clear; if (ff.x1 < x) x = ff.x1; }
        else { x = x1 + clear; if (ff.x0 > x) x = ff.x0; }
      }
      const y = storm && G.side !== defenderSide ? seam + G.s * (9 + fr) : (T.seamY ?? 0) + G.s * (LAYOUT.contactGap / 2 + fr);
      bigSpot.set(gi, { x, y, fr, side: G.side });
    }
    const moverX = (A) => (bigSpot.has(A.idx) ? bigSpot.get(A.idx).x : pathAt(A.path, ws, tmp).x);
    for (const it of sortedItems) {
      const b = it.b;
      if (!it.duel) continue;
      const A = T.G[b.att], Tg = T.G[b.tgt];
      const fa = frontageOf(A, ws), ft = frontageOf(Tg, ws);
      const ox0 = Math.max(fa.x0, ft.x0), ox1 = Math.min(fa.x1, ft.x1);
      const cx = ox0 <= ox1 ? (ox0 + ox1) / 2 : (fa.x + ft.x) / 2;
      bindTo(b.tgt, b.tm, isBlock(A) ? cx : moverX(A), it.t); // a monster's victim stands at the monster
      const tf = figOf(b.tgt, b.tm);
      const tx = bigSpot.has(b.tgt) ? bigSpot.get(b.tgt).x : figPos(T, tf, ws, tmp).x;
      if (shownAt(it, 1)) bindTo(b.att, b.am, tx, it.t);
    }
    // press kills of members not bound above fall at the front too
    for (const it of sortedItems) if (!it.duel && it.b.outcome === 'kill') {
      const A = T.G[it.b.att];
      bindTo(it.b.tgt, it.b.tm, moverX(A), it.t);
    }
    const moverAt = [];
    for (const [gi, { it, foe }] of movers) {
      const G = T.G[gi];
      const g = G.g;
      const foeF = gi === it.b.att ? figOf(it.b.tgt, it.b.tm) : figOf(it.b.att, it.b.am);
      const fp = figPos(T, foeF, ws, { x: 0, y: 0, h: 0 });
      const fr = g.size >= 3 ? LAYOUT.footR[g.size] : 6;
      const sideY = storm && G.side !== defenderSide ? seam + G.s * 9 : (T.seamY ?? 0) + G.s * (LAYOUT.contactGap / 2 + fr);
      let x = fp.x, y = sideY;
      let h = storm && G.side === defenderSide && G.onWall ? W.wallH : 0;
      const spot = bigSpot.get(gi);
      if (spot) { x = spot.x; y = spot.y; h = 0; } // flyers land to fight
      if (G.routT !== null) continue;
      if (!spot) { // two leaders never stand in one place
        for (let k = 0; k < 12 && moverAt.some((q) => q.side === G.side && Math.hypot(q.x - x, q.y - y) < 14); k++) x += (k % 2 ? -1 : 1) * 14 * (k + 1);
        moverAt.push({ side: G.side, x, y });
      }
      const cur = pathAt(G.path, t0, { x: 0, y: 0, h: 0 });
      const dist = Math.hypot(cur.x - x, cur.y - y);
      const arrive = Math.max(0.4, Math.min(it.t - 0.3 - t0, dist / 160));
      pathMove(G.path, t0, Math.max(0.3, arrive), x, y, h, 'smooth');
    }
    // ---- blows ----
    for (const it of sortedItems) {
      const b = it.b;
      const ag = groupOf(b.att);
      const af = figOf(b.att, b.am), tf = figOf(b.tgt, b.tm);
      const mot = ag.unit === 'greatWyrm' && b.wname === 'Bite' ? WYRM_BITE : MOTIONS[b.wname] || MOTIONS.Unarmed;
      if (it.duel && aliveAt(af, it.t - mot[1])) {
        af.strikes.push({ t: it.t, wind: mot[1], strike: mot[2], rec: mot[3], lunge: mot[4], motion: mot[0], tf: tf.id, item: it, big: ag.size >= 3 });
      }
      const o = b.outcome;
      if (groupOf(b.tgt).isCmd) cmdHit(b.tgt, it.t, b.dealt);
      if (o === 'kill') { killFigure(tf, it.t, 'melee'); tf.reacts.push({ t: it.t, kind: 'kill', item: it }); burst(it.t, 0, 0, 0, 'blood', ag.size >= 3 ? 14 : 10, null); T.bursts[T.bursts.length - 1].f = tf.id; }
      else if (o === 'wound') { wound(tf, it.t, b.hpBefore - b.dealt); tf.reacts.push({ t: it.t, kind: 'wound', item: it }); burst(it.t, 0, 0, 0, 'blood', 4, it); T.bursts[T.bursts.length - 1].f = tf.id; }
      else if (o === 'blocked') { tf.reacts.push({ t: it.t, kind: 'blocked', item: it }); burst(it.t, 0, 0, 0, 'spark', 4, it); T.bursts[T.bursts.length - 1].f = tf.id; }
      else if (o === 'miss') tf.reacts.push({ t: it.t, kind: 'dodge', item: it });
      else if (o === 'onFallen') burst(it.t, 0, 0, 0, 'dust', 3, it), (T.bursts[T.bursts.length - 1].f = tf.id);
      if (ag.size >= 4 && o !== 'miss') burst(it.t, 0, 0, 0, 'dust', 10, null), (T.bursts[T.bursts.length - 1].f = tf.id);
    }
    // retaliation burns: the striker burns
    for (const b of burns) {
      const f = figOf(b.tgt, b.tm);
      const tb = Math.min(we, ws + u01(b.key) * (we - ws));
      if (groupOf(b.tgt).isCmd) cmdHit(b.tgt, tb, b.dealt);
      if (b.outcome === 'kill') killFigure(f, tb, 'burn'); else if (b.outcome === 'wound') wound(f, tb, b.hpBefore - b.dealt);
      burst(tb, 0, 0, 0, 'fire', 6, null); T.bursts[T.bursts.length - 1].f = f.id;
    }
    // ---- push: the seam leans toward the side that is losing (not at a standing wall) ----
    const nk = blows.filter((b) => b.outcome === 'kill' && T.G[b.att].side === nearS).length;
    const fk = blows.filter((b) => b.outcome === 'kill' && T.G[b.att].side === farS).length;
    meleeHistory.push({ nk, fk });
    if (!storm && T.seamY !== null) {
      const h2 = meleeHistory.slice(-2);
      const dealt = h2.reduce((a, x) => a + x.nk, 0), taken = h2.reduce((a, x) => a + x.fk, 0);
      const push = dealt + taken > 0 ? LAYOUT.push * (dealt - taken) / (dealt + taken) : 0;
      const target = T.seamY - T.seamPush + push;
      const dy = target - T.seamY;
      if (Math.abs(dy) > 1) {
        for (const gi of contact) {
          const G = T.G[gi];
          if (!isBlock(G) || G.routT !== null) continue;
          const cur = pathAt(G.path, we, { x: 0, y: 0, h: 0 });
          pathMove(G.path, we, 1.0, cur.x, cur.y + dy, cur.h, 'smooth');
        }
        T.seamY = target; T.seamPush = push;
        holdSecondLine(we, 1.0, contactSet);
      }
    }
    // seam churn: blood marks the ground where the lines met
    const fr = contact.map((gi) => T.G[gi]).filter(isBlock).map((G) => frontageOf(G, we));
    if (fr.length) {
      T.decals.push({ t: we, kind: 'churn', x0: Math.min(...fr.map((f) => f.x0)), x1: Math.max(...fr.map((f) => f.x1)), y: T.seamY ?? 0, kills, key: T.decals.length });
    }
    // beats
    if (first) beat(ws, 'The lines meet', 10, 'contact');
    for (const ch of T.charges.filter((c) => c.t >= t0 && c.t <= t0 + 2)) {
      const tgts = [...new Set(blows.filter((b) => b.att === ch.g).map((b) => b.tgt))];
      beat(ch.t, `${displayName(groupOf(ch.g))} charge` + (tgts.length ? ` the ${displayName(groupOf(tgts[0]))}` : ''), 8, 'charge');
    }
    for (const gi of new Set(blows.filter((b) => groupOf(b.att).big).map((b) => b.att))) {
      const k = blows.filter((b) => b.att === gi && b.outcome === 'kill').length;
      if (k) beat(ws + 0.3, `${displayName(groupOf(gi))} strikes · ${k} slain`, 8, 'monster');
    }
    camKey(t0, contact.flatMap((gi) => T.G[gi].figs), 0.12);
    void r;
    return Wd;
  }

  // =====================================================================================
  function moralePhase(p, t0) {
    let dur = p.morale.length ? 0.3 : 0;
    for (const m of p.morale) {
      const G = T.G[m.group];
      if (!G) continue;
      T.glyphs.push({ g: m.group, t0, t1: t0 + 1.0, kind: m.broke ? 'broke' : 'held', roll: m.roll });
      if (!m.broke && isBlock(G) && G.routT === null && !G.onWall) {
        const cur = pathAt(G.path, t0, { x: 0, y: 0, h: 0 });
        pathMove(G.path, t0, 0.2, cur.x, cur.y + G.s * 4, cur.h, 'smooth');
        pathMove(G.path, t0 + 0.4, 0.3, cur.x, cur.y, cur.h, 'smooth');
      }
    }
    p.routs.forEach((gi, k) => {
      const G = T.G[gi];
      if (!G) return;
      const tr = t0 + 0.15 + 0.12 * k;
      routGroup(G, tr);
      dur = Math.max(dur, Math.min(2.2, 1.0 + 0.3 * k));
      const g = groupOf(gi);
      const share = (g.start || 1);
      beat(tr, `${displayName(g)} ${g.isCmd ? 'flees' : 'break and run'}`, share >= 10 ? 6 : 3, 'rout');
      camKey(tr, G.figs, 0.2);
    });
    return dur;
  }
  function routGroup(G, tr) {
    G.routT = tr;
    const edgeY = G.s * (L.bands[G.side].back + LAYOUT.edgeZone);
    for (const fi of G.figs) {
      const f = T.F[fi];
      if (!aliveAt(f, tr)) continue;
      const u = u01(T.id + '/rout/' + f.id);
      const ang = (u * 2 - 1) * (15 * Math.PI / 180);
      const p0 = figPos(T, f, tr, { x: 0, y: 0, h: 0 });
      const dx = Math.sin(ang), dy = G.s * Math.cos(ang);
      const D = Math.max(40, Math.abs(edgeY - p0.y) - 40) / Math.max(0.5, Math.cos(ang));
      f.rout = { t: tr + 0.3 * u01(T.id + '/stag/' + f.id), dx, dy, D, dur: Math.max(2.5, D / 120 * 1.5), tLeave: null };
    }
  }

  function endPhase(p, t0) {
    let dur = p.events.length ? 0.4 : 0;
    for (const e of p.expires) {
      for (const rg of T.rings) if (rg.g === e.target && rg.source === e.source && rg.t1 === Infinity) rg.t1 = t0;
    }
    for (const h of p.heals) {
      const arr = T.cmdHp[h.target];
      if (arr) arr.push({ t: t0 + 0.1, hp: arr[arr.length - 1].hp + h.amount });
      const G = T.G[h.target];
      if (G) { burst(t0 + 0.1, 0, 0, 0, 'motes', 6, null); T.bursts[T.bursts.length - 1].f = G.figs[0]; }
    }
    return dur;
  }

  // =====================================================================================
  function deathSequences(p, t0) {
    let extra = 0;
    p.deathInfo.forEach((d, k) => {
      const g = groupOf(d.commander);
      const f = figOf(d.commander, 0);
      const tb = f.death ? f.death.t : t0;
      if (!f.death) killFigure(f, tb, 'death');
      const god = !!g.pretender;
      if (k === 0) T.slow.push({ t0: tb - 0.25, t1: tb + (god ? 2.0 : 1.0), rate: god ? 0.2 : 0.3 });
      let by = '';
      if (d.blow) {
        const kg = groupOf(d.blow.att);
        by = d.blow.src === 'spell' ? `burned by ${SPELL_NAMES[d.blow.spell] || d.blow.spell}` : kg.isCmd ? `slain by ${displayName(kg)}` : `slain by a ${kg.unitName} of the ${plural(kg)}`;
      }
      T.nameCards.push({ g: d.commander, t0: tb + (god ? 1.2 : 1.0), t1: tb + (god ? 4.2 : 3.0), text: by, god, round: p.round });
      beat(tb, god ? `THE GOD FALLS: ${displayName(g)}` : `${displayName(g)} has fallen` + (by ? `, ${by}` : ''), god ? 20 : 10, 'death');
      camKey(tb - 0.4, [f.id, ...(d.blow ? [figOf(d.blow.att, d.blow.am).id] : [])], 0.9, 2.0);
      extra += god ? 3.6 : k === 0 ? 2.4 : 0.8;
    });
    return extra;
  }
}

/** A breath shows in its nation's color (display only, docs/05): flame for the Cinder Horde, a green-gold blight for Thornwood. */
function breathColor(g, B) { const n = B.sides[g.side].def; return n === 'thornwood' ? 0x9fd860 : 0xff8a2a; }
