// Close looks: every painted troop block at 72 px and 28 px, every commander at 150 px (rest and act), card bars.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique/shots/';
const ONLY = process.env.ONLY || '';
const want = (n) => !ONLY || ONLY.split(',').some((o) => n.includes(o));
const W = 1600, H = 900;
const page = await open(W, H, '?paused=1');
const log = [];
const aim = (k, t, X, Y, f) => page.evaluate(([k, t, X, Y, f]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  G.follow = false; G.user = { cx: X, cy: Y, z: f / 28 * Math.max(window.innerWidth / 1920, 0.5) }; G.render(t); G.render(t); return true;
}, [k, t, X, Y, f]);
for (const k of ['a', 'b', 'c']) {
  const meta = await page.evaluate((k) => {
    const G = window.__battle.game; G.load(k); G.playing = false;
    const st = G.stage, T = st.T, m = G.moments();
    return { m, groups: st.S.groups.map((g) => ({ idx: g.idx, unit: g.unit, cmd: !!g.isCmd, size: g.size, look: st.paint.lookOf[g.idx], appear: T.G[g.idx].appear, side: g.side, name: g.personal })) };
  }, k);
  // A: blocks at 72 px and 28 px (deploy), centred on the hull
  for (const g of meta.groups.filter((q) => !q.cmd && q.size < 3 && q.appear === -Infinity)) {
    for (const [f, tag] of [[72, '72'], [28, '28']]) {
      const name = `blk-${k}-${g.unit}-${g.idx}-${tag}`;
      if (!want(name)) continue;
      const c = await page.evaluate(([gi, t]) => { const G = window.__battle.game; G.seek(t); const h = G.stage.hull(G.stage.T.G[gi], t); return h ? { X: h.X, Y: h.Y } : null; }, [g.idx, 2.2]);
      if (!c) continue;
      await aim(k, 2.2, c.X, c.Y - 10, f);
      const cw = f === 72 ? 900 : 420, ch = f === 72 ? 560 : 260;
      await page.screenshot({ path: DIR + name + '.png', clip: { x: (W - cw) / 2, y: (H - ch) / 2, width: cw, height: ch } });
      log.push(name);
    }
  }
  // B: commanders at 150 px: at rest (2.2), and at their first act (rally or cast)
  for (const g of meta.groups.filter((q) => q.cmd && q.size < 3)) {
    const name = `cmd-${k}-${g.unit}-${g.idx}`;
    if (!want(name)) continue;
    const info = await page.evaluate(([gi]) => {
      const G = window.__battle.game, st = G.stage, T = st.T, f = T.F[T.G[gi].figs[0]];
      const acts = [];
      for (const s of f.shots) acts.push(s.t + 0.05, s.tRel + 0.05);
      const r = st.paint.rally[gi]; if (r) for (const x of r) acts.push(x + 0.2, x + 0.7);
      return { acts: acts.filter((x) => x > 0.5).slice(0, 2), face: (PAINT.groups.find((x) => x.battle === G.key && x.group === gi) || {}).face || null, look: st.paint.lookOf[gi] };
    }, [g.idx]);
    const times = [2.2, ...info.acts];
    let j = 0;
    for (const t of times) {
      const c = await page.evaluate(([gi, t]) => { const G = window.__battle.game; G.seek(t); const T = G.stage.T, f = T.F[T.G[gi].figs[0]]; const p = figPos(T, f, t, { x: 0, y: 0, h: 0 }); return { X: sx(p.x, p.y), Y: sy(p.x, p.y, p.h) }; }, [g.idx, t]);
      await aim(k, t, c.X, c.Y - 18, 150);
      await page.screenshot({ path: DIR + `${name}-${j++}.png`, clip: { x: W / 2 - 200, y: H / 2 - 200, width: 400, height: 400 } });
    }
    log.push(`${name} face ${info.face} look ${info.look} shots ${times.length}`);
  }
}
// C: card bars at 1920 x 1080, at each battle's clash
const p2 = await open(1920, 1080, '?paused=1');
for (const k of ['a', 'b', 'c']) {
  if (!want('cards-' + k)) continue;
  await p2.evaluate((k) => { const G = window.__battle.game; G.load(k); G.playing = false; const m = G.moments(); G.follow = true; G.user = null; G.seek(m.clash); G.render(m.clash); }, k);
  await p2.screenshot({ path: DIR + `cards-${k}.png`, clip: { x: 0, y: 970, width: 1100, height: 110 } });
  await p2.screenshot({ path: DIR + `cardsTop-${k}.png`, clip: { x: 0, y: 0, width: 420, height: 60 } });
  log.push('cards-' + k);
}
return log;
