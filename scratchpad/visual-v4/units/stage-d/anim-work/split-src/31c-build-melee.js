'use strict';
// ---- buildTimeline, part 4: the melee phase (the seam, dressing, binding, free movers, blows, the push) ----
// Split from 31-build.js (stage D animation part: modules under 400 lines); behaviour is unchanged.

function tl_frontageOf(C, G, t) {
  const o = pathAt(G.path, t, { x: 0, y: 0, h: 0 });
  return { x0: o.x + G.ext.u0 - 6, x1: o.x + G.ext.u1 + 6, x: o.x, y: o.y };
}

function tl_meleePhase(C, p, t0, r) {
  const { T, tmp, groupOf, near, isBlock, aliveAt, present, figOf, storm, defenderSide, W, meleeHistory, lastDress, ownBlocksAtLine, freeLateral, holdSecondLine, flattenWedge, applyFlatten, killFigure, wound, burst, cmdHit, beat, camKey, rankItems, frontageOf } = C;
  const blows = p.blows.filter((b) => b.phase === 'melee' && (b.src === 'melee' || b.src === 'ranged'));
  const burns = p.blows.filter((b) => b.src === 'burn');
  const contact = (p.engage ? p.engage.contact : []).filter((gi) => T.G[gi] && present(T.G[gi], t0));
  if (!blows.length && !contact.length) return 0;
  const first = !C.firstContactDone;
  C.firstContactDone = true;
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
    const cur0 = pathAt(G.path, t0, { x: 0, y: 0, h: 0 });
    const dist = Math.hypot(cur0.x - x, cur0.y - y);
    // at most 200 wu/s, a hard run (critique-resume fix 4): when the blow comes too soon, set off earlier, but never
    // before the mover's previous move ends, its last shot, breath or blow begun before the phase ends, or 3 s before
    // the phase
    let busy = -1e9;
    for (const fi of G.figs) {
      const f = T.F[fi];
      for (const s of f.shots) if (s.t <= t0) busy = Math.max(busy, s.tRel + 0.4, s.dur ? s.t + s.dur : -1e9);
      for (const s of f.strikes) if (s.t <= t0) busy = Math.max(busy, s.t + s.strike + s.rec);
    }
    const start = Math.min(t0, Math.max(G.path[G.path.length - 1].t1, busy, t0 - 3, it.t - 0.3 - dist / 200));
    const arrive = Math.max(0.4, Math.min(it.t - 0.3 - start, dist / 160));
    pathMove(G.path, start, Math.max(0.3, arrive), x, y, h, 'smooth');
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
