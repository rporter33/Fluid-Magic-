// Node harness: runs the page's pure modules (script, layout, timeline) on battles.json.
const fs = require('fs');
const dir = __dirname + '/../src/';
const files = ['00-util.js', '10-script.js', '20-layout.js', '30-timeline.js', '31-build.js', '32-finish.js'];
const code = files.map((f) => fs.readFileSync(dir + f, 'utf8')).join('\n') + '\nmodule.exports={buildScript,layoutBattle,buildTimeline,countAt,figPos,T:null};';
const m = { exports: {} };
new Function('module', 'exports', code)(m, m.exports);
const battles = JSON.parse(fs.readFileSync(__dirname + '/../battle-data/battles.json', 'utf8'));
for (const B of battles) {
  const t0 = Date.now();
  const S = m.exports.buildScript(B);
  const L = m.exports.layoutBattle(S);
  const T = m.exports.buildTimeline(S, L);
  const ms = Date.now() - t0;
  let bad = 0;
  for (const pe of T.phaseEnds) {
    if (!pe.fold) continue;
    for (const [gi, v] of Object.entries(pe.fold.units)) {
      const c = m.exports.countAt(T, +gi, pe.t);
      if (c !== v[0]) { bad++; if (bad < 6) console.log('  mismatch', B.key, pe.round, pe.phase, gi, B.groups[gi].unit, 'count', c, 'fold', v[0]); }
    }
  }
  const deaths = T.F.filter((f) => f.death).length;
  const foldDead = B.groups.reduce((a, g, i) => a + (g.cmd ? 1 : g.start) - B.end[i][0], 0);
  console.log(B.key, 'dur', T.duration.toFixed(1), 's; build', ms, 'ms; figs', T.F.length, 'deaths', deaths, 'expected', foldDead,
    'proj', T.projectiles.length, 'bursts', T.bursts.length, 'decals', T.decals.length, 'beats', T.beats.length, 'mismatches', bad,
    'cam', T.camera.length, 'seam', T.seamY);
}
