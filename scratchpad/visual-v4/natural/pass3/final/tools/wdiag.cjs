// diagnose wild-edge fails from my probe: rerun given cameras with end clearance 3 and 6, dump the failing samples and crop shots around them
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), CODE = fs.readFileSync(__dirname + '/vrprobe.js', 'utf8');
const CAMS = JSON.parse(process.argv[3] || '[]');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 897); await mev(p, CODE); const out = [];
  for (const [nm, src] of CAMS) { await ev(p, src); await p.waitForTimeout(1500);
    const a = await mev(p, '__vr.wild({ endClear: 3, nex: 20, depths: { rule: [[6, 7, 8, 9], [6, 7, 8, 9, 9.5]] } })'), c = await mev(p, '__vr.wild({ endClear: 6, nex: 20, depths: { rule: [[6, 7, 8, 9], [6, 7, 8, 9, 9.5]] } })'), pg = await ev(p, 'm.reliefWildEdge()');
    console.log(nm, a.band, a.Dpx, 'end3', a.rule.fails + '/' + a.rule.n, a.rule.minR, 'end6', c.rule.fails + '/' + c.rule.n, c.rule.minR, 'page', pg.fails + '/' + pg.samples); for (const x of c.rule.ex) console.log('   e6', x); for (const x of a.rule.ex) if (!c.rule.ex.includes(x)) console.log('   e3', x);
    await p.screenshot({ path: `${SHOTS}V-diag-${nm}-dpr${dpr}.png` }); out.push({ nm, a, c, page: pg }); }
  fs.writeFileSync(`${OUT}wdiag-dpr${dpr}.json`, JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
