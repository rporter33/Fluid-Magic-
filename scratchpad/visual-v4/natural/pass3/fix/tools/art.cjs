// art iteration: node art.cjs <tag> [file] [query] [dpr]  ->  wip/<tag>/<view>.png (land layer) + edge stats; world-centred cameras like the art verifier's
const { launch, open, ev, mev, PAGE, ME } = require('./lib.cjs'); const fs = require('fs');
const tag = process.argv[2] || 'x', file = process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : PAGE, q = process.argv[4] && process.argv[4] !== '-' ? process.argv[4] : '', dpr = Number(process.argv[5] || 1);
const D = ME + 'wip/' + tag + '/'; fs.mkdirSync(D, { recursive: true });
const A = [491.96, 239.47], M = [911.91, 588.11], G = [640.42, 676.33];
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, X = (k, c) => `m.setScale(m.maxScale() * ${k}, ${c[0]}, ${c[1]})`;
const V = (process.env.VIEWS || '').split(',').filter(Boolean);
const VIEWS = [['01-start', 'm.ev("fit(); RCK = null; draw()")', 'all'], ['02-far', S('60 / m.ev("MED_DIAM")', 720, 450), 'all'], ['02b-min', S('m.minScale()', 720, 450), 'all'], ['03-mid-ash', S(1.0, ...A), 'The Ashspine'], ['04-mid-grey-mere', S(1.0, 780, 640), 'all'],
  ['05-near-ash', X(0.55, A), 'The Ashspine'], ['06-near-grey', X(0.6, G), 'The Greyteeth'], ['07-near-mere', X(0.6, M), 'The Still Mere'], ['08-max-ash', X(1.0, A), 'The Ashspine'], ['09-max-grey', X(1.0, G), 'The Greyteeth'], ['10-max-mere', X(1.0, M), 'The Still Mere']];
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, dpr, settle: 1500, q }); await p.mouse.move(720, 897);
  const st = {}; console.log(tag, 'ready', p.__readyMs);
  for (const [v, src, wn] of VIEWS) { if (V.length && !V.includes(v)) continue; await ev(p, src); await p.waitForTimeout(1500);
    const E = await ev(p, 'm.reliefWildEdge()'); st[v] = { samples: E.samples, fails: E.fails, share: E.rim && E.rim.quietEdgeShare, worst: E.worstFailRatio, ex: E.examples.slice(0, 2) };
    await mev(p, "for (const k of ['rails','pieces','labels','badges','arrows']) SKIP.add(k); RCK = null; draw();"); await p.waitForTimeout(300);
    let clip = null; { const bb = await mev(p, `(() => { let b = [1e9, 1e9, -1e9, -1e9]; for (const w of WILDS) if ('${wn}' === 'all' || w.name === '${wn}') for (const c of w.cells) for (const pt of cells[c]) { const [x, y] = toScreen(...pt); b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; } return b; })()`); const x0 = Math.max(0, Math.floor(bb[0] - 24)), y0 = Math.max(0, Math.floor(bb[1] - 24)), x1 = Math.min(1440, Math.ceil(bb[2] + 24)), y1 = Math.min(900 - 70, Math.ceil(bb[3] + 24)); clip = x1 - x0 > 20 && y1 - y0 > 20 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null; }
    await p.screenshot({ path: `${D}${v}.png`, clip: clip ?? undefined }); await mev(p, 'SKIP.clear(); RCK = null; draw();');
    console.log(tag, v, JSON.stringify(st[v])); }
  st.look = await ev(p, 'm.reliefWildLook()'); st.times = await ev(p, '(() => { const t = m.reliefTimes(); return { bakeCpu: t.bakeCpuMs, nat: t.naturalStepsMs }; })()'); st.msT = await mev(p, 'RB.msT || null');
  console.log(tag, 'look', JSON.stringify(st.look).slice(0, 500)); console.log(tag, 'times', JSON.stringify(st.times).slice(0, 400), JSON.stringify(st.msT));
  fs.writeFileSync(D + 'stats.json', JSON.stringify(st, null, 1)); console.log(tag, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close(); })();
