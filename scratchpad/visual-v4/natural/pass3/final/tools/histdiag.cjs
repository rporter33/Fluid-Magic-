// the rung cache: is a frame at scale s the same whether its rung was first decided at s or at another scale in the same rung? node histdiag.cjs <dpr> <target: min|mid|start>
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), tgt = process.argv[3] || 'min';
const FR = `(() => { const was = new Set(SKIP); SKIP.clear(); for (const k of ['pieces', 'labels', 'badges', 'arrows']) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } window.__fr = window.__fr || []; window.__fr.push(d); return (h >>> 0).toString(16); })()`;
(async () => { const b = await launch(), out = {};
  for (const order of ['direct', 'viaNeighbour']) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, dpr, settle: 0, reducedMotion: 'reduce' }); await p.mouse.move(720, 897);
    const S = await mev(p, `(() => { const s0 = ${tgt === 'min' ? 'minScale' : tgt === 'mid' ? '1.0' : 'cam.s'}; const r0 = rlQeRung(s0); let s2 = null; for (const f of [1.0049, 1.004, 1.003, 1.002, 0.9951, 0.996, 0.997, 0.998]) { const s = s0 * f; if (s >= minScale && Math.abs(rlQeRung(s) - r0) < 1e-12) { s2 = s; break; } } return { s0, s2, r0, lru: RL_WRIM.lru ? [...RL_WRIM.lru.keys()].map(Number).map((x) => +x.toFixed(4)) : null }; })()`);
    const cx = 800, cy = 500;
    if (order === 'viaNeighbour') { await ev(p, `m.setScale(${S.s2}, ${cx}, ${cy})`); await p.waitForTimeout(300); }
    await ev(p, `m.setScale(${S.s0}, ${cx}, ${cy})`); await p.waitForTimeout(300);
    const h = await mev(p, FR); const E = await ev(p, 'm.reliefWildEdge()'); const M = await ev(p, 'm.reliefWildMargins()');
    out[order] = { S, hash: h, edge: [E.samples, E.fails, E.rim && E.rim.quietEdgeShare], margin: M.min, lruAfter: await mev(p, 'RL_WRIM.lru ? RL_WRIM.lru.size : null') };
    const raw = await mev(p, 'Array.from(window.__fr[0].filter((_, k) => k % 4 !== 3))').catch(() => null);
    out[order].raw = raw; console.log(order, JSON.stringify({ ...out[order], raw: undefined })); await p.screenshot({ path: `${SHOTS}V-histdiag-${tgt}-${order}-dpr${dpr}.png` }); await p.context().close(); }
  if (out.direct.raw && out.viaNeighbour.raw) { const a = out.direct.raw, c = out.viaNeighbour.raw; let n = 0, mx = 0; for (let k = 0; k < a.length; k++) { const dd = Math.abs(a[k] - c[k]); if (dd) { n++; mx = Math.max(mx, dd); } } console.log('channel values differing', n, 'of', a.length, 'max diff', mx); }
  await b.close(); })();
