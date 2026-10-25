// node probe.cjs <session> : runs the AD probes in the mockup page; prints JSON
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const PR = __dirname + '/ad-adprobe.js';
const set = (expr) => `m.ev(${JSON.stringify(expr + '; clampCam(); RCK = null; draw()')})`;
const P = (fn) => `window.__ad.${fn}`;
const SESS = {
  nat2: { q: '', w: 1440, h: 900, steps: [
    ['start', null, ['hfCores()']], ['ref', 'm.zoomTo(1.142, "Ashmoor")', ['hfCores()']], ['ref-ash', set("const w = WILDS.find(q => q.kind === 'peaks'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = 1.142; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s"), ['hfCores()']],
    ['far-min', 'm.setScale(m.minScale(), 800, 500)', ['hfCores()', 'farRaster()']],
  ] },
  nat: { q: '', w: 1440, h: 900, steps: [
    ['start', null, ['borderEnrich(__ad.landSkip)', 'edgeSteps()', 'faintEdges()', 'wildSharp()']],
    ['ref', 'm.zoomTo(1.142, "Ashmoor")', ['borderEnrich(__ad.landSkip)', 'edgeSteps()', 'faintEdges()', 'wildSharp()']],
    ['max-ash', set("const w = WILDS.find(q => q.kind === 'peaks'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = maxScale; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s"), ['wildSharp()']],
    ['max-mere', set("const w = WILDS.find(q => q.kind === 'mere'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = maxScale; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s"), ['wildSharp()']],
    ['far-min', 'm.setScale(m.minScale(), 800, 500)', ['borderEnrich(__ad.landSkip)', "borderEnrich([...__ad.landSkip, 'farRelief'])", 'edgeSteps()', "edgeSteps([...__ad.landSkip, 'farRelief'])", 'farMeans()', 'faintEdges()']],
    ['far-69', 'm.setScale((m.minScale() + m.fitScale()) / 2 * 1.0, 800, 500)', ['borderEnrich(__ad.landSkip)', "borderEnrich([...__ad.landSkip, 'farRelief'])"]],
  ] },
  clear: { q: '?terrain=clear', w: 1440, h: 900, steps: [
    ['start', null, ['borderEnrich(__ad.landSkip)', 'edgeSteps()']],
    ['ref', 'm.zoomTo(1.142, "Ashmoor")', ['borderEnrich(__ad.landSkip)', 'edgeSteps()']],
    ['far-min', 'm.setScale(m.minScale(), 800, 500)', ['borderEnrich(__ad.landSkip)']],
  ] },
  phone: { q: '', w: 390, h: 844, steps: [
    ['start', null, ['overflow()']], ['fit', set('cam.s = fitScale'), ['overflow()']], ['min', set('cam.s = minScale'), ['overflow()']],
  ] },
};
(async () => {
  const b = await launch(); const res = {};
  for (const nm of process.argv.slice(2)) {
    const C = SESS[nm], log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w: C.w, h: C.h, settle: 1500, q: C.q });
    await p.evaluate((src) => window.__mock.ev(src), require('fs').readFileSync(PR, 'utf8')); await p.mouse.move(C.w / 2, C.h - 6); res[nm] = {};
    if (nm === 'phone') { await ev(p, `m.ev("state.sel = { type: 'cmd', id: 'varo' }; RCK = null; draw()")`); const t = await ev(p, 'm.across()'); const [x, y] = await ev(p, `m.at(${JSON.stringify(t)})`); await p.mouse.click(x + 4, y + 30, { button: 'right' }); await p.mouse.move(C.w / 2, C.h - 6); await p.waitForTimeout(800); }
    for (const [tag, setup, fns] of C.steps) {
      if (setup) await ev(p, setup); await p.waitForTimeout(900); res[nm][tag] = { scale: await ev(p, '[+m.scale().toFixed(3), m.band(), +(m.scale()*m.ev("MED_DIAM")).toFixed(1)]') };
      for (const f of fns) { const t0 = Date.now(); try { res[nm][tag][f] = await p.evaluate((s) => eval('window.__ad.' + s), f); } catch (e) { res[nm][tag][f] = 'ERR ' + e.message.slice(0, 200); } console.error(nm, tag, f, Date.now() - t0, 'ms'); }
    }
    res[nm].pageErrors = log.pageErrors; await p.context().close();
  }
  console.log(JSON.stringify(res, null, 1)); await b.close();
})();
