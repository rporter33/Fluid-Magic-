// Which pilot containers cost draw calls at a moment: toggles each one off in turn.
const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page } = await openPage(browser, process.argv[2], '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game, out = [];
    for (const [b, spell, n, dt] of [['a', 'fireball', 0, 0.05], ['a', 'fireball', 0, -0.3], ['a', 'fireball', 5, 0.05], ['c', 'entangle', 0, 0.15]]) {
      G.load(b); G.playing = false;
      const L = G.stage.fx, fx = L.spells.filter((x) => x.spell === spell)[n], t = fx.beats.impact[0] + dt;
      G.seek(t); G.render(t);
      const gl = G.app.renderer.gl; let c = 0;
      const de = gl.drawElements, da = gl.drawArrays;
      gl.drawElements = function (...a) { c++; return de.apply(gl, a); }; gl.drawArrays = function (...a) { c++; return da.apply(gl, a); };
      const count = () => { c = 0; G.app.renderer.render(G.app.stage); return c; };
      const all = count();
      const parts = { groundN: L.groundN.c, groundA: L.groundA.c, airN: L.airN.pc, airA: L.airA.c, decals: L.decals.layer, flash: L.flash };
      const res = { at: b + ' ' + spell + n + ' impact' + (dt >= 0 ? '+' : '') + dt, all };
      for (const [k, o] of Object.entries(parts)) { const v = o.visible; o.visible = false; res[k] = all - count(); o.visible = v; }
      const uv = L.units.list.map((s) => s.visible); L.units.list.forEach((s) => (s.visible = false)); res.unitsFx = all - count(); L.units.list.forEach((s, i) => (s.visible = uv[i]));
      res.visible = Object.fromEntries(Object.entries(parts).map(([k, o]) => [k, o.visible]));
      gl.drawElements = de; gl.drawArrays = da;
      out.push(res);
    }
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  await browser.close();
})();
