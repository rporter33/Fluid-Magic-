// Stage B fix pass shots (run by drv.cjs), beside the integration set: the far Thornwood blocks at play zoom (fix 2),
// generals with their banners and the block standards (fix 6), the Salamander's collapse (fix 10), the key-cast fixes
// (fix 9: Ember Skirmisher javelins, Elder Druid 08's staff, Longbow Hunter bows), the hue-locked Wolf Riders (fix 2),
// a death landing in its own pose (fix 4), and the rout arriving (fix 5c). Writes units/stage-b/shots/fix-*.png.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/shots/';
const log = [];
const page = await open(1920, 1080, '?paused=1');
const snap = async (name, clip) => { await page.screenshot({ path: DIR + name + '.png', ...(clip ? { clip } : {}) }); log.push(name); };
const at = (k, t, focus, px) => page.evaluate(([k, t, focus, px]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  const st = G.stage, T = st.T;
  let X, Y;
  if (focus.fig !== undefined) { const p = figPos(T, T.F[focus.fig], t, { x: 0, y: 0, h: 0 }); X = sx(p.x, p.y); Y = sy(p.x, p.y, p.h) - (focus.dy || 20); }
  else { const h = st.hull(T.G[focus.g], t); if (!h) return false; X = h.X; Y = h.Y - (focus.dy || 14); }
  G.follow = false; G.user = { cx: X + (focus.dx || 0), cy: Y, z: px / 28 };
  G.render(t); G.render(t); return true;
}, [k, t, focus, px]);
const auto = (k, t) => page.evaluate(([k, t]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.follow = true; G.user = null; G.seek(t); G.render(t); G.render(t); }, [k, t]);
const find = (k, fn) => page.evaluate(([k, src]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); const st = G.stage, T = st.T; return (new Function('st', 'T', 'G', src))(st, T, G); }, [k, fn]);

// fix 2: the far Thornwood side at play zoom, automatic camera at deploy (battles a and c), and close at 28 px
for (const k of ['a', 'c']) {
  const m = await page.evaluate((k) => { const G = window.__battle.game; G.load(k); return G.moments(); }, k);
  await auto(k, m.deploy); await snap(`fix-side-${k}-deploy`);
  const g = await find(k, "const far = st.B.nearSide === 'attacker' ? 'defender' : 'attacker'; const q = T.G.filter((x) => x.side === far && !x.g.isCmd && x.g.size < 3 && st.paint.lookOf[x.idx]).sort((a, b) => b.figs.length - a.figs.length)[0]; return q ? q.idx : null;");
  if (g !== null) { await at(k, 2.2, { g }, 28); await snap(`fix-side-${k}-far-28px`, { x: 560, y: 290, width: 800, height: 500 }); }
}
// fix 6: generals with banners at 72 px, and the block standards at play zoom
for (const k of ['a', 'b', 'c']) {
  const gens = await find(k, "return st.genBanners.map((b) => ({ fig: b.G.figs[0], unit: b.G.g.unit }));");
  let j = 0;
  for (const gb of gens.slice(0, 2)) { await at(k, 3.0, { fig: gb.fig, dy: 30 }, 72); await snap(`fix-banner-${k}-${++j}-${gb.unit}`, { x: 660, y: 240, width: 600, height: 520 }); }
  // a general rallying (the banner flares)
  const r = await find(k, "for (const b of st.genBanners) { const ra = st.paint.rally[b.G.idx]; if (ra && ra.length > 1) return { fig: b.G.figs[0], t: ra[1] + 0.3 }; } return null;");
  if (r) { await at(k, r.t, { fig: r.fig, dy: 30 }, 72); await snap(`fix-banner-${k}-rally`, { x: 660, y: 240, width: 600, height: 520 }); }
}
// fix 10: the Salamander's death in battle c: before, falling, collapsed, and 3 s later
{
  const s = await find('c', "const G2 = T.G.find((x) => x.g.unit === 'salamander'); if (!G2) return null; const f = T.F[G2.figs[0]]; return f.death ? { fig: f.id, t: f.death.t, fall: f.death.fall } : null;");
  if (s) {
    let j = 0;
    for (const dt of [-0.15, s.fall * 0.5, s.fall + 0.1, s.fall + 3]) { await at('c', s.t + dt, { fig: s.fig, dy: 30 }, 40); await snap(`fix-salamander-death-${++j}`, { x: 560, y: 240, width: 800, height: 600 }); }
  }
}
// fix 9: key cast removed (tier H, 72 px): Ember Skirmisher backs (battle a, near side), Elder Druid 08 (battle a, far),
// Longbow Hunters (battle c, far)
for (const [k, unit, tag] of [['a', 'emberSkirmisher', 'es'], ['c', 'longbowHunter', 'lbh'], ['a', 'elderDruid', 'ed08']]) {
  const g = await find(k, `const q = T.G.find((x) => x.g.unit === '${unit}'); return q ? q.idx : null;`);
  if (g === null) continue;
  const fig = await find(k, `return T.G[${g}].figs[0];`);
  await at(k, 2.4, unit === 'elderDruid' ? { fig, dy: 24 } : { g }, unit === 'elderDruid' ? 110 : 72);
  await snap(`fix-keycast-${tag}`, { x: 560, y: 240, width: 800, height: 600 });
}
// fix 2: the hue-locked Wolf Riders (battle c) standing and charging
{
  const g = await find('c', "const q = T.G.find((x) => x.g.unit === 'wolfRider' && st.paint.lookOf[x.idx]); return q ? q.idx : null;");
  if (g !== null) {
    await at('c', 2.4, { g }, 56); await snap('fix-wolfrider-c-deploy', { x: 460, y: 240, width: 1000, height: 600 });
    const m = await page.evaluate(() => window.__battle.game.moments());
    await at('c', m.clash + 0.5, { g }, 56); await snap('fix-wolfrider-c-clash', { x: 460, y: 240, width: 1000, height: 600 });
  }
}
// fix 4 + 5c: a painted death landing (falling, then on the ground in the same pose), a rout arriving
{
  const d = await find('a', "for (let i = 0; i < T.F.length; i++) { const f = T.F[i], sp = st.sprites[i]; if (f.death && sp && sp.paint && sp.paint.look.kind === 'troop' && f.death.t > 10) return { fig: i, t: f.death.t, fall: f.death.fall }; } return null;");
  if (d) { let j = 0; for (const dt of [0.1, d.fall * 0.75, d.fall + 0.05, d.fall + 1]) { await at('a', d.t + dt, { fig: d.fig, dy: 8 }, 96); await snap(`fix-death-land-${++j}`, { x: 760, y: 340, width: 400, height: 400 }); } }
  const r = await find('c', "for (let i = 0; i < T.F.length; i++) { const f = T.F[i], sp = st.sprites[i]; if (f.rout && sp && sp.paint && sp.paint.look.kind === 'troop' && !f.death && f.rout.dur > 2) return { fig: i, t: f.rout.t, dur: f.rout.dur }; } return null;");
  if (r) { let j = 0; for (const dt of [0.3, r.dur * 0.5, r.dur * 0.95, r.dur + 0.6]) { await at('c', r.t + dt, { fig: r.fig, dy: 12 }, 72); await snap(`fix-rout-${++j}`, { x: 660, y: 290, width: 600, height: 500 }); } }
}
return log;
