// does the wild edge (rim / quiet edge) decision change when the camera only pans? node panstab.cjs <page>  -> out/panstab-<page>.json
// at a fixed zoom the camera is moved by small screen offsets; after each move the static layer is rebuilt (RCK = null; draw()) and the decision's per-piece signature
// (which stretches carry the light line, and its solved lightness where the build solves one) is compared with the first; the wild edge test is run at each position
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2];
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
const SIG = `(() => { const m = RL_WRIM.map; if (!m) return null; const o = {}; for (const [k, E] of m) { const b = []; for (let i = 0; i < E.np; i++) b.push(E.bad[i] ? (E.Ls ? Math.round(E.Ls[i]) : 1) : 0); o[k] = { b, need: E.need ? (Array.isArray(E.need) ? Math.round(E.need[0]) : E.need) : null }; } return o; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { page: PN, views: {} };
  const p = await open(b, page(PN), { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC);
  const V = [['start', 0.5478775892930478, 800, 500], ['mid', 1.0, (wc.grey[0] + wc.mere[0]) / 2, (wc.grey[1] + wc.mere[1]) / 2 - 40], ['ashNear', 'max55', wc.ash[0], wc.ash[1]]];
  const offs = [[0, 0], [0.37, 0], [0, 0.61], [1, 1], [2.5, -1.5], [7, 3], [-11, 5], [23, -9], [0, 0]];
  for (const [v, s0, x0, y0] of V) {
    const s = s0 === 'max55' ? await ev(p, 'm.maxScale() * 0.55') : s0; const rows = []; let ref = null;
    for (const [dx, dy] of offs) {
      await ev(p, `m.setScale(${s}, ${x0 + dx / s}, ${y0 + dy / s})`); await p.waitForTimeout(900);
      await mev(p, "RCK = null; if (typeof RL_WRIM !== 'undefined') RL_WRIM.key = RL_WRIM.key; draw()"); await p.waitForTimeout(300);
      const sig = await mev(p, SIG), E = await ev(p, 'm.reliefWildEdge()');
      if (!ref) ref = sig; let pieces = 0, flips = 0, dL = 0;
      for (const k of Object.keys(ref || {})) { const a = ref[k].b, c = sig && sig[k] ? sig[k].b : []; for (let i = 0; i < a.length; i++) { pieces++; if ((a[i] > 0) !== (c[i] > 0)) flips++; else if (a[i] > 1 && c[i] > 1) dL = Math.max(dL, Math.abs(a[i] - c[i])); } }
      rows.push({ dx, dy, pieces, flips, maxDeltaL: dL, edgeSamples: E.samples, edgeFails: E.fails, share: E.rim && (E.rim.share ?? E.rim.quietEdgeShare) });
      console.log(PN, v, 'pan', dx, dy, 'pieces', pieces, 'flips', flips, 'maxDeltaL', dL, 'edge', E.fails + '/' + E.samples, 'share', JSON.stringify(E.rim));
    }
    out.views[v] = rows;
  }
  out.pageErrors = log.pageErrors; console.log(PN, 'pageErrors', log.pageErrors.length);
  fs.writeFileSync(`${OUT}panstab-${PN}.json`, JSON.stringify(out, null, 1)); await b.close();
})();
