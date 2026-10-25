// the wild edge decision on this page against the page before the polish, at the same views: every edge decided on both must have the same failing samples
const { launch, open, ev, mev, PAGE, BEFORE } = require('./lib.cjs');
(async () => { const b = await launch(), out = {};
  for (const [nm, file] of [['now', PAGE], ['before', BEFORE]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500 }); await p.mouse.move(720, 895);
    const wc = await mev(p, 'WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [x / w.cells.length, y / w.cells.length]; })'), D = await mev(p, 'MED_DIAM'); out[nm] = {};
    const V = [['start', 'm.ev("fit(); draw()")'], ['least', 'm.setScale(m.minScale(), 800, 500)'], ['far60', `m.setScale(${60 / D}, 720, 450)`], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ...wc.flatMap((c, k) => [[`near${k}`, `m.setScale(${336 / D}, ${c[0]}, ${c[1]})`], [`max${k}`, `m.setScale(${420 / D}, ${c[0]}, ${c[1]})`]])];
    for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(300); out[nm][v] = await mev(p, 'Object.fromEntries([...RL_WRIM.map].map(([k, E]) => [k, Array.from(E.fail).join("") + "/" + Array.from(E.seen).join("")]))'); }
    console.log(nm, 'pageErrors', log.pageErrors.length); await p.context().close(); }
  let diff = 0, common = 0; for (const v of Object.keys(out.now)) { const a = out.now[v], c = out.before[v]; let dv = 0, cv = 0; for (const k of Object.keys(a)) if (k in c) { cv++; if (a[k] !== c[k]) dv++; } diff += dv; common += cv; console.log(v, 'edges now', Object.keys(a).length, 'before', Object.keys(c).length, 'common', cv, 'differ', dv); }
  console.log('SUMMARY common', common, 'differ', diff); await b.close(); })();
