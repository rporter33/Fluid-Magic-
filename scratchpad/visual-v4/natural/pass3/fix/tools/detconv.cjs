// does the start frame settle to one picture on every load? node detconv.cjs [loads] [look]: per load, the canvas hash every second for 20 s at the start view
// (draw() as the page shows it, and a from-scratch redraw), with the state that might move it
const { launch, open, ev, mev, PAGE, OUT, HASH } = require('./lib.cjs'); const fs = require('fs');
const loads = Number(process.argv[2] || 3), look = process.argv[3] || 'natural';
(async () => {
  const all = [];
  for (let L = 0; L < loads; L++) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, PAGE, { log, settle: 0, q: look === 'clear' ? '?terrain=clear' : '', reducedMotion: 'reduce' }); await p.mouse.move(720, 895);
    const seq = [];
    for (let t = 0; t < 20; t++) {
      await p.waitForTimeout(1000);
      const r = await mev(p, `(() => { draw(); const a = ${HASH}; RCK = null; draw(); const b = ${HASH}; return { a, b, wrimKey: RL_WRIM.key.slice(-40), wrimMs: RL_WRIM.ms, fonts: typeof fontsReady !== 'undefined' ? fontsReady : null, s: +cam.s.toFixed(5), x: +cam.x.toFixed(2), y: +cam.y.toFixed(2), figs: FIGS.ready, look: rlShownLook(), nd: RL_ND.n }; })()`);
      seq.push(r);
    }
    const last = seq[seq.length - 1]; const firstStable = seq.findIndex((q, k) => seq.slice(k).every((z) => z.a === last.a && z.b === last.b));
    console.log(look, 'load', L, 'final', last.a, last.b, 'stable from', firstStable + 1, 's', 'distinct a', [...new Set(seq.map((q) => q.a))].join(','), 'distinct b', [...new Set(seq.map((q) => q.b))].join(','), JSON.stringify({ s: last.s, x: last.x, y: last.y, fonts: last.fonts, wrimMs: last.wrimMs }), 'pageErrors', log.pageErrors.length);
    all.push(seq); await b.close();
  }
  const fin = all.map((s) => s[s.length - 1].a + '/' + s[s.length - 1].b); console.log('FINAL same across loads', fin.every((x) => x === fin[0]), JSON.stringify(fin));
  fs.writeFileSync(`${OUT}detconv-${look}.json`, JSON.stringify(all, null, 1));
})();
