// the owner's comparison shots: node owner.cjs <outdir>; per variant (stone band = default, talus, 2 px near-black ink, pass 3 as reviewed) the same land-layer crops round the wilds
const { launch, open, ev, mev, PAGE } = require('./lib.cjs'); const fs = require('fs');
const OUTD = process.argv[2]; fs.mkdirSync(OUTD, { recursive: true });
const BEFORE3 = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix/before/game-screen-v4.html';
const VAR = [['a-band', PAGE, ''], ['b-talus', PAGE, '?wildfoot=talus'], ['c-ink2', PAGE, '?wildink=2'], ['d-pass3', BEFORE3, '']];
const A = [491.96, 239.47], G = [640.42, 676.33];
const VIEWS = [['1-start', 'm.ev("fit(); RCK = null; draw()")', 'all'], ['2-far', 'm.setScale(60 / m.ev("MED_DIAM"), 720, 450)', 'all'], ['3-mid-wilds', 'm.setScale(1.0, 700, 450)', 'all'], ['4-near-grey', `m.setScale(m.maxScale() * 0.6, ${G[0]}, ${G[1]})`, 'The Greyteeth'], ['5-max-ash', `m.setScale(m.maxScale(), ${A[0]}, ${A[1]})`, 'The Ashspine']];
(async () => { const b = await launch(); const errs = [];
  for (const [vn, file, q] of VAR) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500, q }); await p.mouse.move(720, 897);
    for (const [v, src, wn] of VIEWS) { await ev(p, src); await p.waitForTimeout(1600);
      const share = await ev(p, '(() => { const E = m.reliefWildEdge(); return { fails: E.fails, share: E.rim && E.rim.quietEdgeShare }; })()');
      await mev(p, "for (const k of ['rails','pieces','labels','badges','arrows']) SKIP.add(k); RCK = null; draw();"); await p.waitForTimeout(300);
      const bb = await mev(p, `(() => { let b = [1e9, 1e9, -1e9, -1e9]; for (const w of WILDS) if ('${wn}' === 'all' || w.name === '${wn}') for (const c of w.cells) for (const pt of cells[c]) { const [x, y] = toScreen(...pt); b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; } return b; })()`);
      const x0 = Math.max(0, Math.floor(bb[0] - 24)), y0 = Math.max(0, Math.floor(bb[1] - 24)), x1 = Math.min(1440, Math.ceil(bb[2] + 24)), y1 = Math.min(830, Math.ceil(bb[3] + 24));
      await p.screenshot({ path: `${OUTD}/${v}-${vn}.png`, clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } }); await mev(p, 'SKIP.clear(); RCK = null; draw();');
      console.log(vn, v, JSON.stringify(share)); }
    errs.push(...log.pageErrors); await p.context().close(); }
  console.log('pageErrors', errs.length, JSON.stringify(errs.slice(0, 3))); await b.close(); })();
