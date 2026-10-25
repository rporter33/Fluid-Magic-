// fix2 shots (run by drv.cjs) beside the integration, fix and resume sets: battle b's painted Wolf Riders (deploy and
// charge) and battle c's routing riders in the new back view; Warden Captains 05 and 07 from behind at 96 px; the card
// bars of b and c; the toned-down stand-ins at the clash; the crack and column spells at 96 px; a wounded figure's hit at
// 72 px (no white cut-out); battle b's Ember Adept 02 running to his duel. Writes units/stage-b/shots/fix2-*.png.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/shots/';
const log = [];
const page = await open(1600, 900, '?paused=1', { dpr: 2 });
const snap = async (name, clip) => { await page.screenshot({ path: DIR + name + '.png', ...(clip ? { clip } : {}) }); log.push(name); };
const auto = (k, t) => page.evaluate(([k, t]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.follow = true; G.user = null; G.seek(t); G.render(t); G.render(t); }, [k, t]);
const atFig = (k, t, fi, px, dy) => page.evaluate(([k, t, fi, px, dy]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  const T = G.stage.T, p = figPos(T, T.F[fi], t, { x: 0, y: 0, h: 0 });
  G.follow = false; G.user = { cx: sx(p.x, p.y), cy: sy(p.x, p.y, p.h) - (dy || 20), z: px / 28 * Math.max(window.innerWidth / 1920, 0.5) };
  G.render(t); G.render(t);
  const sp = G.stage.sprites[fi];
  return sp && sp.paint ? { look: sp.paint.key, tier: G.stage.paint.tier, view: sp.curView, tex: PAINTLIB.texLook.get(sp.texture), tint: sp.tint.toString(16) } : { procedural: true };
}, [k, t, fi, px, dy]);
const atXY = (k, t, X, Y, px) => page.evaluate(([k, t, X, Y, px]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  G.follow = false; G.user = { cx: X, cy: Y, z: px / 28 * Math.max(window.innerWidth / 1920, 0.5) }; G.render(t); G.render(t);
}, [k, t, X, Y, px]);
const out = {};
const C = { x: 450, y: 180, width: 700, height: 520 };
// Wolf Riders
const wr = await page.evaluate(() => { const r = {}; for (const k of ['b', 'c']) { const G = window.__battle.game; G.load(k); const T = G.stage.T; const q = T.G.find((x) => x.g.unit === 'wolfRider'); r[k] = { fig: q.figs[0], rout: q.routT, figs: q.figs.slice(0, 6) }; } return r; });
for (const [tag, t] of [['deploy', 2.7], ['advance', 20.4], ['fight', 26]]) { out['b-wr-' + tag] = await atFig('b', t, wr.b.fig, 72, 20); await snap(`fix2-b-wolfriders-${tag}`, C); }
if (wr.c.rout) for (const [tag, dt] of [['rout1', 0.6], ['rout2', 1.4]]) { out['c-wr-' + tag] = await atFig('c', wr.c.rout + dt, wr.c.fig, 72, 20); await snap(`fix2-c-wolfriders-${tag}`, C); }
// Warden Captains 05 and 07 from behind, battle b
const wc = await page.evaluate(() => { const G = window.__battle.game; G.load('b'); const st = G.stage, T = st.T; return T.G.filter((q) => q.g.unit === 'wardenCaptain').map((q) => ({ fig: q.figs[0], look: st.paint.lookOf[q.idx] })); });
for (const c of wc) for (const [tag, t] of [['deploy', 2.7], ['clash', 14.1]]) { out[`b-${c.look}-${tag}`] = await atFig('b', t, c.fig, 96, 26); await snap(`fix2-b-${c.look}-back-${tag}`, { x: 550, y: 160, width: 500, height: 520 }); }
// card bars
for (const k of ['b', 'c']) {
  await auto(k, 2.7);
  const r = await page.evaluate(() => { const b = document.getElementById('bar').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  await snap(`fix2-${k}-cardbar`, { x: Math.max(0, r.x - 4), y: Math.max(0, r.y - 4), width: Math.min(1600, r.w + 8), height: r.h + 8 });
}
// stand-ins at the clash on the automatic camera, and close
for (const [k, t] of [['a', 14.6], ['b', 30.1], ['a', 6.5]]) { await auto(k, t); await snap(`fix2-${k}-standins-${t}`); }
const big = await page.evaluate(() => { const r = {}; for (const k of ['a', 'b']) { const G = window.__battle.game; G.load(k); const st = G.stage; r[k] = st.bigs.map((b) => ({ fig: b.f.id, unit: b.G.g.unit, filtered: !!(b.body.root.filters && b.body.root.filters.length) })); } return r; });
out.bigs = big;
const wy = big.a.find((b) => b.unit === 'greatWyrm');
if (wy) { await atFig('a', 14.6, wy.fig, 40, 40); await snap('fix2-a-greatwyrm-close', C); }
const tr = big.b.find((b) => b.unit === 'treant');
if (tr) { await atFig('b', 30.1, tr.fig, 50, 40); await snap('fix2-b-treant-close', C); }
// spells at 96 px: the crack (battle b, Sapling Druid 03) and the column (battle b, Grove Priest 01)
const fx = await page.evaluate(() => { const G = window.__battle.game; G.load('b'); const T = G.stage.T; const c = T.spellFx.find((f) => f.look && f.look.kind === 'crack'); const k = T.spellFx.find((f) => f.look && f.look.kind === 'column'); return { crack: { caster: c.caster, rel: c.release, imp: c.impact }, column: { caster: k.caster, rel: k.release, imp: k.impact } }; });
out.fx = fx;
await atFig('b', fx.crack.rel + 0.6 * (fx.crack.imp - fx.crack.rel), fx.crack.caster, 96, 26); await snap('fix2-b-crack-96', C);
await atFig('b', fx.column.imp + 0.1, fx.column.caster, 60, 26); await snap('fix2-b-column', C);
// a wound at 72 px: the frame that used to be the white silhouette
const wd = await page.evaluate(() => { const G = window.__battle.game; G.load('a'); const T = G.stage.T; for (const f of T.F) { const g = T.G[f.g]; if (g.g.size >= 3 || !G.stage.paint.lookOf[g.idx]) continue; const rc = (f.reacts || []).find((r) => r.kind === 'wound' && (!f.death || f.death.t > r.t + 1)); if (rc) return { fig: f.id, t: rc.t }; } return null; });
if (wd) { out.wound = await atFig('a', wd.t + 0.02, wd.fig, 72, 20); await snap('fix2-a-wound-hit-72', { x: 600, y: 250, width: 400, height: 400 }); }
// battle b: Ember Adept 02 runs to his duel (set off earlier, at most 200 wu/s)
const ea = await page.evaluate(() => { const G = window.__battle.game; G.load('b'); const T = G.stage.T; const q = T.G.find((x) => x.g.unit === 'emberAdept'); return { fig: q.figs[0], seg: q.path.filter((s) => s.t1 - s.t0 > 0 && Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / (s.t1 - s.t0) > 150).map((s) => [s.t0, s.t1]) }; });
out.ea = ea;
if (ea.seg.length) { const [a0, a1] = ea.seg[0]; for (const [i, q] of [[0, 0.15], [1, 0.5], [2, 0.85]]) { out['ea' + i] = await atFig('b', a0 + q * (a1 - a0), ea.fig, 60, 26); await snap(`fix2-b-emberAdept-run-${i}`, C); } }
return { log, out };
