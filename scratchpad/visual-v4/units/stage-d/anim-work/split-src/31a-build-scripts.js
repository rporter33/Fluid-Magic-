'use strict';
// ---- buildTimeline, part 2: the scripts phase (casts, advances, summons) and the sampling ranks (docs/12 S2.6) ----
// Split from 31-build.js (stage D animation part: modules under 400 lines). Each phase takes the build's context C
// (31-build.js) and reads its state and helpers from it; behaviour is unchanged.

function tl_scriptsPhase(C, p, t0) {
  const { L, T, tmp, groupOf, figOf, spellCount, casterSpell, killFigure, wound, burst, cmdHit, beat, camKey } = C;
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
    // stage D pilot: the storyboard's beats (45-fx-looks.js); ?fxtiming=short plays docs/12's short forms for comparison
    const fb = fxBeats(c.spellId, FX_SETTINGS.timing === 'short' && form === 'full' ? 'short' : form, tc - t0 > 5.0);
    if (fb) { charge = fb.charge; travel = fb.release + fb.travel; }
    const family = fxFamily(c.spellId, look); // docs/09: at most 3 burst or field effects at once, later casts queue
    const start = fxQueueStart(T, family, tc), release = start + charge, queued = start - tc;
    const impact = Math.max(release + travel, lastImpact + 0.08);
    lastImpact = impact;
    tc = release;
    const casterF = figOf(c.caster, 0);
    const targets = c.targets.filter((gi) => T.G[gi]);
    const fxl = FX_LOOKS[c.spellId] || null;
    const blast = fxl && fxl.template === 'burst' ? fxClusters(T, hits.map((h) => figOf(h.tgt, h.tm)), impact, fxl) : null;
    T.spellFx.push({ spell: c.spellId, look, form, fatigue: c.fatigue, t0: start, release, impact, t1: impact + 0.7, caster: casterF.id, cg: c.caster,
      targets, hitFigs: hits.map((h) => figOf(h.tgt, h.tm).id), beats: fb ? fxBeatTimes(start, release, impact, fb) : null, clusters: blast ? blast.list : null,
      family, concurrent: !!(FX_FAMILIES[family] && FX_FAMILIES[family].concurrent), queued: +queued.toFixed(3), playEnd: fb ? impact + fb.impact + fb.linger : impact + (form === 'brief' ? 0.25 : 0.55),
      key: hash32(T.id + '/fx/' + c.caster + '/' + c.spellId + '/' + nc) });
    const fxRec = T.spellFx[T.spellFx.length - 1];
    casterF.shots.push({ t: start, tRel: release, kind: 'cast', item: null, recoil: fxl && fxl.release && fxl.release.recoil ? fxl.release.recoil : undefined });
    // hits land at impact, spread a little
    hits.forEach((h, j) => {
      let th = impact + (look.kind === 'meteors' ? 0.6 * (j / Math.max(1, hits.length)) : 0.04 * (j % 5));
      const f = figOf(h.tgt, h.tm);
      const bk = blast ? blast.of.get(f.id) : null; // the burst's own troops at impact; a fragment's when it lands
      if (bk) th = bk.t;
      if (groupOf(h.tgt).isCmd) cmdHit(h.tgt, th, h.dealt);
      if (h.outcome === 'kill') {
        if (bk) killFigure(f, th, 'spell:' + c.spellId, { centre: bk.cluster, look: fxl }); // its burn-out is drawn by the effects layer
        else { killFigure(f, th, 'spell:' + c.spellId); burst(th, 0, 0, 0, 'fire', 10, null); T.bursts[T.bursts.length - 1].f = f.id; }
      }
      else if (h.outcome === 'wound') { wound(f, th, h.hpBefore - h.dealt); f.reacts.push({ t: th, kind: 'wound', item: null, element: fxl ? fxl.element : null, fx: fxl ? fxRec.key : undefined }); } // a pilot spell's element: a fire wound flashes orange, not white (critique fix 2)
      else f.reacts.push({ t: th, kind: 'blocked', item: null });
    });
    // buffs from this cast: rings under the target blocks until they expire
    const evs = p.events.filter((e) => e.i > ci && e.i < nextI);
    for (const e of evs) {
      if (e.kind === 'buff') T.rings.push({ g: e.target, t0: impact, t1: Infinity, color: look.color, debuff: e.debuff, source: e.source, stat: e.stat, delta: e.delta,
        until: e.untilRound ?? null, fx: !!(fxl && e.debuff) }); // fx: the pilot layer draws this curse's ring (a sprite, not the Graphics ring)
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
    const debuffs = evs.filter((e) => e.kind === 'buff' && e.debuff);
    const curse = debuffs.length ? ` · ${debuffs.map((e) => `${e.delta > 0 ? '+' : '−'}${Math.abs(e.delta)} ${String(e.stat).toUpperCase()}`).join(' ')}` + (debuffs[0].untilRound != null ? ` for ${debuffs[0].untilRound - T.rounds[T.rounds.length - 1].round + 1} rounds` : '') : '';
    const text = `${displayName(caster)}: ${SPELL_NAMES[c.spellId] || c.spellId}` + (kills ? ` · ${kills} slain` : tgtNames ? ` on ${tgtNames}` : '') + curse;
    if (look.level >= 3 || kills >= 3) beat(impact, text, 6, 'spell'); else T.ticker.push({ t: impact, text });
    camKey(start, [casterF.id, ...targets.flatMap((gi) => T.G[gi].figs.slice(0, 40))], 0.15);
    end = Math.max(end, fb ? impact + fb.impact + Math.max(fb.linger, 0.1) : impact + (form === 'brief' ? 0.25 : 0.55));
  });
  if (p.summons.length && !nCast) end = Math.max(end, t0 + 1.2);
  const dur = Math.max(0, end - t0);
  return p.casts.length || p.advances.length || p.summons.length ? Math.max(dur, 0.6) : 0;
}

function tl_rankItems(C, p, items, kind) {
  const { groupOf } = C;
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
