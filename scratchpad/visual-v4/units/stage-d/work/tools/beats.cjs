// Shoots a pilot spell beat by beat: node beats.cjs PAGE OUTDIR battle spell n zoom [--w 1600 --h 900] [--times a,b,...] [--q ?..]
// zoom 1: the automatic camera (play zoom); zoom 2: twice its zoom, centred on the action of each beat.
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const [PAGE, OUT, battle, spell, nStr, zoomStr] = a;
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const { page, errors } = await openPage(browser, PAGE, opt('q', '?paused=1'), { w: +opt('w', 1600), h: +opt('h', 900), reducedMotion: opt('rm', 'no-preference') });
  const plan = await page.evaluate(([battle, spell, n]) => {
    const G = window.__battle.game; G.load(battle); G.playing = false;
    const fx = G.stage.fx.spells.filter((x) => x.spell === spell)[n];
    const b = fx.beats, T = G.stage.T, p = { x: 0, y: 0, h: 0 };
    figPos(T, fx.casterF, b.charge[0], p); const C = { X: sx(p.x, p.y), Y: sy(p.x, p.y, 20) };
    let I;
    if (fx.clusters && fx.clusters.length) I = { X: sx(fx.clusters[0].x, fx.clusters[0].y), Y: sy(fx.clusters[0].x, fx.clusters[0].y, 10) };
    else { const h = fx.held[0]; I = { X: sx(h.x, h.y), Y: sy(h.x, h.y, 10) }; }
    const M = { X: (C.X + I.X) / 2, Y: (C.Y + I.Y) / 2 - 30 };
    const L = (b.linger[1] - b.impact[0]);
    const times = [
      ['charge-start', b.charge[0] + 0.02, C], ['charge-mid', (b.charge[0] + b.charge[1]) / 2, C], ['charge-end', b.charge[1] - 0.02, C],
      ['release', b.release[0] + 0.03, C], ['travel-early', b.travel[0] + (b.travel[1] - b.travel[0]) * 0.25, M], ['travel-mid', (b.travel[0] + b.travel[1]) / 2, M],
      ['travel-late', b.travel[0] + (b.travel[1] - b.travel[0]) * 0.85, I], ['impact-core', b.impact[0] + 0.012, I], ['impact-mid', (b.impact[0] + b.impact[1]) / 2, I],
      ['impact-end', b.impact[1] - 0.01, I], ['linger-early', b.linger[0] + 0.12, I], ['linger-end', Math.max(b.linger[1], b.impact[1] + 0.3), I],
      ['after-1s', b.impact[0] + 1.0, I], ['after-2s', b.impact[0] + 2.0, I]];
    if (spell === 'entangle') { const h = fx.held[0]; times.push(['hold', Math.min(h.t1 - 0.5, b.impact[0] + 4), I], ['wither-start', h.t1 + 0.1, I], ['wither-mid', h.t1 + 0.3, I], ['wither-end', h.t1 + 0.7, I]); }
    return { times: times.map(([name, t, P]) => ({ name, t, X: P.X, Y: P.Y })), beats: b, form: b.form };
  }, [battle, spell, +nStr]);
  const zoom = +zoomStr;
  const want = opt('times', null);
  const shots = [];
  for (const s of plan.times) {
    if (want && !want.split(',').includes(s.name)) continue;
    const info = await page.evaluate(([s, zoom]) => {
      const G = window.__battle.game;
      G.follow = true; G.user = null; G.seek(s.t); G.render(s.t);
      if (zoom !== 1) { const c = G.curCam; G.user = { cx: s.X, cy: s.Y, z: c.z * zoom }; G.follow = false; G.render(s.t); }
      return { manPx: +(28 * G.stage.world.scale.x).toFixed(1), particles: G.stage.fx.stats.particles, updateMs: +G.stage.fx.stats.updateMs.toFixed(2) };
    }, [s, zoom]);
    const file = path.join(OUT, `${battle}-${spell}${nStr}-${zoom}x-${s.name}.png`);
    await page.screenshot({ path: file, timeout: 180000 });
    shots.push({ ...s, ...info, file: path.basename(file) });
  }
  fs.writeFileSync(path.join(OUT, `${battle}-${spell}${nStr}-${zoom}x.json`), JSON.stringify({ plan, shots, errors }, null, 1));
  console.log(JSON.stringify({ n: shots.length, errors, form: plan.form }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
