// CPU per frame at the pilot's moments, before (A) and after (B), interleaved rounds (the audit harness's method:
// update = camera + stage.frame + HUD, render = Pixi submit; GPU synced outside the timed region by a 1-pixel
// readPixels; draw calls counted by wrapping gl.draw*). SwiftShader: GPU waits are not representative and excluded.
//   node perf_moments.cjs A.html B.html OUT.json [--rounds 3]
const fs = require('fs');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const MOMENTS = [
  { name: 'a Fireball 1 (full)', b: 'a', spell: 'fireball', n: 0 },
  { name: 'a Fireball 6 (short, 4 kills)', b: 'a', spell: 'fireball', n: 5 },
  { name: 'c Entangle (full)', b: 'c', spell: 'entangle', n: 0 },
];
async function setup(page) {
  await page.evaluate(() => {
    const G = window.__battle.game; G.loop = () => {};
    window.__run = (b, spell, n, painted) => {
      G.setFigures(painted ? 'painted' : 'procedural'); G.load(b); G.playing = false; G.speed = 1;
      const T = G.stage.T;
      const fxs = T.spellFx.filter((x) => x.spell === spell);
      const fx = fxs[n];
      const t0 = fx.t0 - 0.2, t1 = fx.t0 + 2.6;
      const gl = G.app.renderer.gl, px = new Uint8Array(4);
      window.__draws = 0; // one wrapper per page, counting into a page-global (a closure would keep the first run's counter)
      if (!gl.__w) { gl.__w = true; for (const fn of ['drawElements', 'drawArrays']) { const o = gl[fn].bind(gl); gl[fn] = (...x) => { window.__draws++; return o(...x); }; } }
      const up = [], rd = [], dr = [], fxms = [];
      let i = 0;
      for (let t = t0; t <= t1; t += 1 / 60, i++) {
        const A = performance.now();
        G.applyCamera(t); G.stage.frame(t, 1, G.view); G.hud.update(t);
        const Bt = performance.now();
        window.__draws = 0; G.app.renderer.render(G.app.stage);
        const C = performance.now();
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (i >= 6) { up.push(Bt - A); rd.push(C - Bt); dr.push(window.__draws); if (G.stage.fx) fxms.push(G.stage.fx.stats.updateMs); }
      }
      const pct = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
      const sum = up.map((x, k) => x + rd[k]);
      return { frames: up.length, span: [+t0.toFixed(2), +t1.toFixed(2)], updateP50: pct(up, 0.5), updateP95: pct(up, 0.95), renderP50: pct(rd, 0.5), renderP95: pct(rd, 0.95),
        cpuP50: pct(sum, 0.5), cpuP95: pct(sum, 0.95), cpuMax: +Math.max(...sum).toFixed(2), drawsP50: pct(dr, 0.5), drawsMax: Math.max(...dr), fxUpdateP50: pct(fxms, 0.5), fxUpdateMax: fxms.length ? +Math.max(...fxms).toFixed(2) : null };
    };
  });
}
(async () => {
  const browser = await launch();
  const A = await openPage(browser, a[0], '?paused=1'), B = await openPage(browser, a[1], '?paused=1');
  await setup(A.page); await setup(B.page);
  const rounds = +opt('rounds', 3);
  const res = { A: a[0], B: a[1], rounds, viewport: '1920x1080@1', note: 'SwiftShader software GL on a shared 4-core VM: CPU times only; noisy', runs: [] };
  for (let r = 0; r < rounds; r++) for (const m of MOMENTS) for (const painted of [true, false]) for (const [tag, P] of [['A', A.page], ['B', B.page]]) {
    await P.evaluate(() => window.gc && window.gc());
    const x = await P.evaluate(([b, s, n, p]) => window.__run(b, s, n, p), [m.b, m.spell, m.n, painted]);
    res.runs.push({ round: r, moment: m.name, mode: painted ? 'painted' : 'procedural', page: tag, ...x });
    process.stderr.write(`${r} ${m.name} ${painted ? 'P' : 'p'} ${tag} cpu ${x.cpuP50}/${x.cpuP95} draws ${x.drawsP50}/${x.drawsMax} fx ${x.fxUpdateP50}/${x.fxUpdateMax}\n`);
    fs.writeFileSync(a[2], JSON.stringify(res, null, 1));
  }
  res.errors = { A: A.errors, B: B.errors };
  fs.writeFileSync(a[2], JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
