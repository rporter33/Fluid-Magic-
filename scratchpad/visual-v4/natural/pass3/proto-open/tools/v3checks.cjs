// every v3 check in window.__mock under Painted (v3), this build and the page before the AD fixes
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const out = {};
  for (const [nm, file] of [['now', PAGE], ['beforeAD', BEFORE]]) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, file, { log, settle: 3000, q: '?look=v3' }); await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 }); await p.mouse.move(720, 895); await p.waitForTimeout(3000);
    const r = {};
    for (const [v, src] of [['start', null], ['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['mid', 'm.setScale(1.0, 640, 480)']]) {
      if (src) await ev(p, src); await p.waitForTimeout(4000);
      r[v] = await ev(p, '(() => { const o = {}; for (const k of ["checks", "paintcheck", "trackcheck", "density", "feats"]) { try { o[k] = m[k](); } catch (e) { o[k] = "ERR " + e.message; } } return o; })()');
    }
    r.silhouettes = await ev(p, '(() => { try { const s = m.silhouettes(); return typeof s === "object" ? JSON.stringify(s).slice(0, 400) : String(s).slice(0, 200); } catch (e) { return "ERR " + e.message; } })()');
    r.pageErrors = log.pageErrors; out[nm] = r; await b.close();
  }
  const s = (x) => JSON.stringify(x);
  for (const v of ['start', 'near', 'mid']) for (const k of ['checks', 'paintcheck', 'trackcheck', 'density', 'feats']) { const a = s(out.now[v][k]), bb = s(out.beforeAD[v][k]); console.log(v, k, a === bb ? 'SAME' : 'DIFF', a.slice(0, 300)); if (a !== bb) console.log('   before', bb.slice(0, 300)); }
  console.log('silhouettes', out.now.silhouettes === out.beforeAD.silhouettes ? 'SAME' : 'DIFF', out.now.silhouettes.slice(0, 200)); console.log('pageErrors', out.now.pageErrors.length, out.beforeAD.pageErrors.length);
  fs.writeFileSync(OUT + 'v3checks.json', JSON.stringify(out, null, 1));
})();
