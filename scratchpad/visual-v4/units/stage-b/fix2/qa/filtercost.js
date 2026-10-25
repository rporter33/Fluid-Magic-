// fix2: the cost of the stand-in tone-down filter (critique-resume fix 11), A/B in one session, alternating rounds:
// as built, then with the filters stripped after each load. Also counts filtered stand-in bodies per battle.
const page = await open(1920, 1080, '?paused=1');
const out = {};
for (const k of ['a', 'b', 'c']) {
  out[k] = await page.evaluate(async (k) => {
    const G = window.__battle.game;
    G.load(k);
    const n = G.stage.standInFilters || 0, bigs = G.stage.bigs.length;
    const m0 = G.stage.T.markers ? G.stage.T.markers : {};
    const from = Math.max(3, (G.stage.T.clash || 10) - 1);
    const orig = G.load.bind(G);
    const rounds = [];
    for (let r = 0; r < 3; r++) {
      G.load = orig;
      const withF = await G.measure(k, 1, 180, from);
      G.load = (key) => { orig(key); for (const b of G.stage.bigs) b.body.root.filters = null; };
      const noF = await G.measure(k, 1, 180, from);
      rounds.push({ withF: [withF.cpuP50, withF.cpuP95, withF.gpuWaitP50], noF: [noF.cpuP50, noF.cpuP95, noF.gpuWaitP50] });
    }
    G.load = orig;
    return { standInFilters: n, bigs, rounds };
  }, k);
}
return out;
