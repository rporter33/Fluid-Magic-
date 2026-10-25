const fs = require('fs');
const dir = __dirname + '/../src/';
const files = ['00-util.js', '10-script.js', '20-layout.js', '30-timeline.js', '31-build.js', '32-finish.js'];
const code = files.map((f) => fs.readFileSync(dir + f, 'utf8')).join('\n') + '\nmodule.exports={buildScript,layoutBattle,buildTimeline};';
const m = { exports: {} }; new Function('module', 'exports', code)(m, m.exports);
const B = JSON.parse(fs.readFileSync(__dirname + '/../battle-data/battles.json', 'utf8'))[0];
const S = m.exports.buildScript(B), T = m.exports.buildTimeline(S, m.exports.layoutBattle(S));
const wf = T.F.find((f) => T.G[f.g].g.unit === 'greatWyrm');
console.log('strikes', wf.strikes.map((s) => [s.t.toFixed(2), s.item.b.outcome, s.item.b.tgt, s.item.mand]));
console.log('shots', wf.shots.map((s) => [s.t.toFixed(2), s.kind]));
// melee blows by the wyrm in the script
for (const r of S.rounds) for (const p of r.phases) for (const b of p.blows) if (b.att === wf.g) console.log('blow', r.round, p.kind, b.wname, b.outcome, b.tgt);
console.log('duration', T.duration);
