// Clear and the Terrain mode against the build before pass 2: the land layer (lines, pieces, labels off) hashed, and the full frame diffed by where the pixels changed
const { launch, open, ev, mev, PAGE } = require('./lib.cjs'); const fs = require('fs');
const BEFORE = process.env.BEFORE, look = process.argv[2] || 'clear';
const VIEWS = [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.9, 260, 640)'], ['far', 'm.setScale(m.minScale(), 800, 500)']];
const GRAB = `(() => { const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), full = rlRedraw([]); const W2 = canvas.width, H2 = canvas.height, toB = (d) => { let s = ''; for (let k = 0; k < d.length; k += 4) s += String.fromCharCode(d[k], d[k + 1], d[k + 2]); return btoa(s); };
  const near = new Uint8Array(W2 * H2); const mark = (a, b, r, v) => { const [ax, ay] = toScreen(...a), [bx, by] = toScreen(...b), L = Math.hypot(bx - ax, by - ay); for (let t = 0; t <= L; t += 0.5) { const x = ax + (bx - ax) * t / L, y = ay + (by - ay) * t / L; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round((x + dx) * dpr), Y = Math.round((y + dy) * dpr); if (X >= 0 && Y >= 0 && X < W2 && Y < H2) near[Y * W2 + X] |= v; } } };
  for (const [, e] of EDGE) mark(e.a, e.b, 7, 1); for (const w of WILDS) for (const e of rlWildOutline(w)) mark(e.a, e.b, 6, 2);
  let nb = ''; for (let k = 0; k < near.length; k++) nb += String.fromCharCode(near[k]); return { W2, H2, land: toB(land), full: toB(full), near: btoa(nb) }; })()`;
(async () => {
  const res = {};
  for (const [nm, file] of [['now', PAGE], ['before', BEFORE]]) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 894);
    if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
    res[nm] = {}; for (const [v, src] of VIEWS) { if (nm === 'now') { if (src) await ev(p, src); await p.waitForTimeout(800); res.cam = res.cam ?? {}; res.cam[v] = await mev(p, '[cam.s, cam.x, cam.y]'); } else { const [s, x, y] = res.cam[v]; await mev(p, `cam.s = ${s}; cam.x = ${x}; cam.y = ${y}; RCK = null; draw()`); } // the same camera on both pages
      await p.waitForTimeout(1500); res[nm][v] = await mev(p, GRAB); } res[nm].errors = log.pageErrors.length; await b.close();
  }
  const out = {};
  for (const [v] of VIEWS) { const A = res.now[v], B = res.before[v], la = Buffer.from(A.land, 'base64'), lb = Buffer.from(B.land, 'base64'), fa = Buffer.from(A.full, 'base64'), fb = Buffer.from(B.full, 'base64'), nr = Buffer.from(A.near, 'base64');
    let landDiff = 0, landNotWild = 0, full = 0, atLines = 0, atWild = 0, elsewhere = 0; const eb = [1e9, 1e9, -1, -1]; for (let k = 0; k < la.length; k += 3) { const q = k / 3; if (la[k] !== lb[k] || la[k + 1] !== lb[k + 1] || la[k + 2] !== lb[k + 2]) { landDiff++; if (!(nr[q] & 2)) landNotWild++; } if (fa[k] !== fb[k] || fa[k + 1] !== fb[k + 1] || fa[k + 2] !== fb[k + 2]) { full++; if (nr[q] & 2) atWild++; else if (nr[q] & 1) atLines++; else { elsewhere++; const x = q % A.W2, y = (q / A.W2) | 0; eb[0] = Math.min(eb[0], x); eb[1] = Math.min(eb[1], y); eb[2] = Math.max(eb[2], x); eb[3] = Math.max(eb[3], y); } } }
    out[v] = { pixels: la.length / 3, landLayerChanged: landDiff, landChangedAwayFromWildOutline: landNotWild, elsewhereBox: eb, frameChanged: full, withinLines7px: atLines, withinWildOutline6px: atWild, elsewhere }; console.log(look, v, JSON.stringify(out[v])); }
  console.log('pageErrors', res.now.errors, res.before.errors); fs.writeFileSync(__dirname + '/../out/same-' + look + '.json', JSON.stringify(out, null, 1));
})();
