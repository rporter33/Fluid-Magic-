'use strict';
// ---- buildTimeline, part 3: the ranged phase, landings, morale, routs, the end of round, commander deaths, the wall ----
// Split from 31-build.js (stage D animation part: modules under 400 lines); behaviour is unchanged.

function tl_rangedPhase(C, p, t0) {
  const { T, B, groupOf, figOf, beat, camKey, rankItems, landing } = C;
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

function tl_landing(C, b, tf, tl, it, pkind) {
  const { T, groupOf, killFigure, wound, burst, cmdHit } = C;
  const tg = groupOf(b.tgt);
  if (tg.isCmd) cmdHit(b.tgt, tl, b.dealt);
  const o = b.outcome;
  if (o === 'kill') { killFigure(tf, tl, pkind); tf.reacts.push({ t: tl, kind: 'kill', item: it }); burst(tl, 0, 0, 0, pkind === 'breath' ? 'fire' : 'blood', pkind === 'breath' ? 12 : 10, null); T.bursts[T.bursts.length - 1].f = tf.id; }
  else if (o === 'wound') { wound(tf, tl, b.hpBefore - b.dealt); tf.reacts.push({ t: tl, kind: 'wound', item: it }); burst(tl, 0, 0, 0, pkind === 'breath' ? 'fire' : 'blood', 5, it); T.bursts[T.bursts.length - 1].f = tf.id; }
  else if (o === 'blocked') { tf.reacts.push({ t: tl, kind: 'blocked', item: it }); burst(tl, 0, 0, 0, 'spark', 4, it); T.bursts[T.bursts.length - 1].f = tf.id; }
  else if (o === 'onFallen') { /* the shaft sticks in the body */ }
  else if (pkind !== 'breath') T.decals.push({ t: tl, kind: 'stub', proj: T.projectiles.length - 1, item: it });
}

function tl_moralePhase(C, p, t0) {
  const { T, groupOf, isBlock, beat, camKey, routGroup } = C;
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

function tl_routGroup(C, G, tr) {
  const { L, T, aliveAt } = C;
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

function tl_endPhase(C, p, t0) {
  const { T, burst } = C;
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

function tl_deathSequences(C, p, t0) {
  const { T, groupOf, figOf, killFigure, beat, camKey } = C;
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

function tl_climbTheWall(C, t0) {
  const { T, isBlock, liveFigs, defenderSide } = C;
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
