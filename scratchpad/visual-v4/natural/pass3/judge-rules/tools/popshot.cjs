// evidence for the quiet edge popping under a sub-pixel pan (proto-massif): node popshot.cjs <page> <view: start|ashNear> <dx> <dy>  -> shots/pop-<page>-<view>-{a,b}.png, crops
const { launch, open, ev, mev, page, SHOTS } = require('./lib.cjs');
const PN = process.argv[2], V = process.argv[3] || 'ashNear', DX = Number(process.argv[4] || 0), DY = Number(process.argv[5] || 0.61);
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
const SIG = `(() => { const m = RL_WRIM.map, o = []; const r = canvas.getBoundingClientRect(); for (const w of WILDS) for (const e of rlWildOutline(w)) { const E = m && m.get(e.c + ':' + e.j); if (!E) continue; for (let i = 0; i < E.np; i++) { const f = (i + 0.5) / E.np, x = e.a[0] + (e.b[0] - e.a[0]) * f, y = e.a[1] + (e.b[1] - e.a[1]) * f, [sx, sy] = toScreen(x, y); o.push({ k: e.c + ':' + e.j + ':' + i, bad: E.bad[i] ? 1 : 0, L: E.Ls ? Math.round(E.Ls[i]) : 0, px: r.left + sx * r.width / W, py: r.top + sy * r.height / H, at: w.name + '/' + names[e.j] }); } } return o; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, page(PN), { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC); const s = V === 'start' ? 0.5478775892930478 : await ev(p, 'm.maxScale() * 0.55'); const [x0, y0] = V === 'start' ? [800, 500] : wc.ash;
  const shot = async (dx, dy, tag) => { await ev(p, `m.setScale(${s}, ${x0 + dx / s}, ${y0 + dy / s})`); await p.waitForTimeout(900); await mev(p, 'RCK = null; draw()'); await p.waitForTimeout(400);
    const sig = await mev(p, SIG), E = await ev(p, 'm.reliefWildEdge()'); await p.screenshot({ path: `${SHOTS}pop-${PN}-${V}-${tag}.png` }); return { sig, E }; };
  const A = await shot(0, 0, 'a'), B = await shot(DX, DY, 'b');
  const mapB = new Map(B.sig.map((q) => [q.k, q])); const flips = A.sig.filter((q) => mapB.has(q.k) && (mapB.get(q.k).bad !== q.bad || Math.abs(mapB.get(q.k).L - q.L) >= 5)).map((q) => ({ k: q.k, at: q.at, a: [q.bad, q.L], b: [mapB.get(q.k).bad, mapB.get(q.k).L], px: Math.round(q.px), py: Math.round(q.py) }));
  console.log(PN, V, 'pan', DX, DY, 'flipped or relit stretches', flips.length, JSON.stringify(flips.slice(0, 12)));
  console.log('edge test a', A.E.fails + '/' + A.E.samples, JSON.stringify(A.E.examples), '| b', B.E.fails + '/' + B.E.samples, JSON.stringify(B.E.examples));
  require('fs').writeFileSync(`${SHOTS}pop-${PN}-${V}.json`, JSON.stringify({ flips, a: A.E, b: B.E }, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close();
})();
