// hover a river and a bridge with the real pointer: their cards; then a province card with its "Roads:" row and the memory card
const { launch, open, ev, mev, PAGE, ME } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
  const pts = await mev(p, `(() => { const R = rlRiverGeo()[0], q = Math.floor(R.S.length * 0.3), bk = [...rlWorld4().bridges.keys()][2], X = rlCrossPt(bk), cr = canvas.getBoundingClientRect(); window.__mock.setScale(140 / MED_DIAM, R.S[q][0], R.S[q][1]); const s1 = toScreen(...R.S[q]), s2 = toScreen(X.x, X.y); return { river: [cr.left + s1[0], cr.top + s1[1]], bridge: [cr.left + s2[0], cr.top + s2[1]] }; })()`);
  const card = async () => p.evaluate(() => { const t = document.querySelector('.tip'); return t ? t.innerText.replace(/\s+/g, ' ').slice(0, 300) : null; });
  await p.mouse.move(pts.river[0], pts.river[1]); await p.waitForTimeout(900); const river = await card(); await p.screenshot({ path: `${ME}wip/hover-river.png` });
  await p.mouse.move(720, 896); await p.waitForTimeout(300); await p.mouse.move(pts.bridge[0], pts.bridge[1]); await p.waitForTimeout(900); const bridge = await card();
  await p.mouse.move(720, 896); await p.waitForTimeout(300); const [kx, ky] = await ev(p, 'm.at("Kharnath")'); await p.mouse.move(kx + 25, ky + 25); await p.waitForTimeout(900); const kh = await card();
  console.log(JSON.stringify({ river, bridge, kharnath: kh }, null, 1), JSON.stringify(log.pageErrors)); await b.close(); })();
