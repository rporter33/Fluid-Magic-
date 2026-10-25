// the owner's line decision on rendered pixels with the REAL pointer, every province in view: node linesall.cjs <natural|clear|terrain|mode:<m>> <dpr> [w h]
// per view: at rest (focus none), then every non-wild province hovered (pointer on it) and then selected (click), the verifier's LP probe (+-7 px, every 1 px)
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const { LP } = require('./lp.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
const tag = `${look.replace(':', '_')}-dpr${dpr}-${W}x${H}`, mode = look.startsWith('mode:') ? look.slice(5) : look === 'terrain' ? 'terrain' : null;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = {}, T0 = Date.now();
  const p = await open(b, PAGE, { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' });
  const away = async () => { await p.mouse.move(W / 2, H - 3); await p.waitForTimeout(250); };
  if (mode) { await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await p.waitForTimeout(1500); }
  const VIEWS = (process.env.VIEWS || 'start,far,mid,ref,near,near1180').split(',');
  const SRC = { start: 'm.ev("fit(); RCK = null; draw()")', far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', near: 'm.setScale(m.maxScale() * 0.8, 700, 500)', near1180: 'm.setScale(m.maxScale() * 0.8, 1180, 300)', m40: 'm.ev("fit(); RCK = null; draw()"); m.setMonth(40)' };
  const SPOTS = String.raw`(() => { const v = viewRect(), r = canvas.getBoundingClientRect(), out = [];
    for (const i of provList) { if (isWild(i)) continue; const [cx, cy] = toScreen(...cent[i]); if (cx < v.l + 30 || cx > v.r - 30 || cy < v.t + 30 || cy > v.b - 30) continue;
      let got = null; for (const [dx, dy] of [[0, 14], [0, -14], [14, 0], [-14, 0], [10, 20], [-10, 20], [0, 26], [20, -10], [-20, -10], [0, 0]]) { const x = cx + dx, y = cy + dy; const el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === i) { got = [r.left + x, r.top + y]; break; } }
      out.push([i, names[i], prov[i].owner || '', fogOf(i) || '', got]); } return out; })()`;
  const brief = (r) => ({ fN: [r.focusNeutral.edges, r.focusNeutral.minOfMins, r.focusNeutral.samplesUnderFloor, r.focusNeutral.samples], fI: [r.focusInternal.edges, r.focusInternal.minOfMins, r.focusInternal.samplesUnderFloor, r.focusInternal.samples], fFog: [r.focusFog.edges, r.focusFog.minOfMins], oN: [r.otherNeutral.edges, r.otherNeutral.medianOfMedians, r.otherNeutral.p90OfMedians, r.otherNeutral.maxOfMax, r.otherNeutral.samplesUnderFloor, r.otherNeutral.samples], oI: [r.otherInternal.edges, r.otherInternal.medianOfMedians, r.otherInternal.p90OfMedians, r.otherInternal.maxOfMax, r.otherInternal.samplesUnderFloor, r.otherInternal.samples], realm: [r.realm.edges, r.realm.minOfMins], under: r.focusUnder.slice(0, 4), bright: r.otherBright.slice(0, 4) });
  const agg = { rest: [], hover: { provs: 0, measured: 0, under: 0, samplesUnder: 0, min: Infinity, minAt: '', misses: [] }, select: { provs: 0, measured: 0, under: 0, samplesUnder: 0, min: Infinity, minAt: '', misses: [] } };
  for (const v of VIEWS) {
    await ev(p, SRC[v]); await away(); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
    const rest = brief(await mev(p, LP([]))); const o = { rest, hover: [], select: [] }; agg.rest.push([v, rest]);
    console.log(tag, v, 'REST', JSON.stringify(rest));
    const spots = await mev(p, SPOTS);
    for (const [i, nm, own, fog, xy] of spots) { if (!xy) { agg.hover.misses.push(v + ':' + nm + ' no spot'); continue; }
      for (const how of ['hover', 'select']) {
        if (how === 'hover') { await p.mouse.move(xy[0], xy[1], { steps: 2 }); await p.waitForTimeout(380); } else { await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(420); await away(); }
        const got = await mev(p, how === 'hover' ? 'hoverProv' : 'state.sel && state.sel.type === "prov" ? state.sel.id : -1');
        const A = agg[how]; A.provs++; if (got !== i) { A.misses.push(`${v}:${nm}->${got}`); if (how === 'select') { await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); } else await away(); continue; }
        const r = await mev(p, LP([i])), q = brief(r); const n = r.focusNeutral.samples + r.focusInternal.samples, su = r.focusNeutral.samplesUnderFloor + r.focusInternal.samplesUnderFloor, mn = Math.min(r.focusNeutral.minOfMins ?? Infinity, r.focusInternal.minOfMins ?? Infinity);
        if (n) { A.measured++; A.samplesUnder += su; if (su) A.under++; if (mn < A.min) { A.min = mn; A.minAt = `${v}:${nm} ${q.under.join('; ')}`; } }
        o[how].push([nm, own, fog, q]); if (su) console.log(tag, v, how, nm, 'UNDER', su, mn, JSON.stringify(q.under));
        if (how === 'hover') await away(); else { await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
      } }
    const H1 = o.hover.map((x) => x[3]), S1 = o.select.map((x) => x[3]); const mins = (L, k) => Math.min(...L.map((q) => q[k][1]).filter((x) => x != null));
    console.log(tag, v, 'hovered', o.hover.length, 'focus min N/I', mins(H1, 'fN'), mins(H1, 'fI'), '| selected', o.select.length, 'focus min N/I', mins(S1, 'fN'), mins(S1, 'fI'), '| other lines while hovering: max p90 N', Math.max(...H1.map((q) => q.oN[2] ?? 0)), 'max N', Math.max(...H1.map((q) => q.oN[3] ?? 0)), 'max p90 I', Math.max(...H1.map((q) => q.oI[2] ?? 0)));
    out[v] = o;
  }
  out.agg = agg; out.pageErrors = log.pageErrors; out.min = +((Date.now() - T0) / 60000).toFixed(1); fs.writeFileSync(`${OUT}linesall-${tag}.json`, JSON.stringify(out, null, 1));
  console.log('AGG', JSON.stringify({ hover: { ...agg.hover, misses: agg.hover.misses.slice(0, 8), nMiss: agg.hover.misses.length }, select: { ...agg.select, misses: agg.select.misses.slice(0, 8), nMiss: agg.select.misses.length } }));
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)), 'min', out.min); await b.close();
})();
