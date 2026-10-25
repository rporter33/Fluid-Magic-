// Hover every province at the start view and at Mid with Varo's march planned: does the hovered name cover a day chip (the other army's
// transit chip or the path's chips)? As built (chip boxes recorded only) against the design's live-label rule (tools/patches.js).
const { launch, open, PAGE, view } = require('./natpage.cjs');
const fs = require('fs');
const PATCH = fs.readFileSync(__dirname + '/patches.js', 'utf8');
const RECORD_ONLY = `(() => { window.NAT_CHIPS = []; const ar = rlArrow.toString().replace("g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4);", "NAT_CHIPS.push([mx - 17, my - 11, mx + 17, my + 11]); g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4);"); rlArrow = eval('(' + ar + ')');
  const dr = rlDraw.toString().replace("if (!SKIP.has('arrows')) {", "if (!SKIP.has('arrows')) { NAT_CHIPS.length = 0;"); rlDraw = eval('(' + dr + ')'); return 'recording'; })()`;
const PROBE = `(() => { const out = { hovered: 0, overlaps: 0, moved: 0, examples: [] }; const lay0 = RL_PIECE_CACHE.get('L');
  for (const i of provList) { hoverProv = i; RCK = null; draw(); const lay = RL_PIECE_CACHE.get('L'); if (!lay || lay.labels.some((q) => q.i === i)) continue; const c = lay.cand.get(i); if (!c) continue; out.hovered++;
    let box; if (window.NAT_LIVE && NAT_LIVE.i === i) { box = NAT_LIVE.box; if (NAT_LIVE.moved) out.moved++; } else { ctx.font = c.font; const tw = ctx.measureText(prov[i].name).width + 8, [x, y] = rlToScr(c.x, c.y, lay.s); box = [x - tw / 2, y - 8, x + tw / 2, y + 8]; }
    const chips = [...NAT_CHIPS, ...RL_THREAD_CHIPS.list.map((q) => q.box)]; const hit = chips.find((q) => box[2] > q[0] && box[0] < q[2] && box[3] > q[1] && box[1] < q[3]);
    if (hit) { out.overlaps++; if (out.examples.length < 4) out.examples.push(prov[i].name); } window.NAT_LIVE = null; }
  hoverProv = -1; RCK = null; draw(); return out; })()`;
(async () => {
  const b = await launch(), errors = [], res = {};
  for (const fixed of [false, true]) {
    const p = await open(b, PAGE, 1440, 900, '', errors, { settle: 1500 });
    await p.evaluate((s) => window.__mock.ev(s), fixed ? PATCH : RECORD_ONLY);
    for (const [tag, src] of [['start', 'm.ev("fitToCloth()")'], ['mid', 'm.setScale(0.62, 760, 520)'], ['start+path', 'm.ev("fitToCloth()"); m.ev("selectCmd(\\"varo\\"); orderMove(0, 0, nearest(1100, 300)); draw()")']]) {
      try { await view(p, src, 1200); } catch (e) { res[`${fixed ? 'fixed' : 'asBuilt'} ${tag}`] = 'view failed: ' + e.message.slice(0, 80); continue; }
      res[`${fixed ? 'fixed' : 'asBuilt'} ${tag}`] = await p.evaluate((s) => window.__mock.ev(s), PROBE);
    }
    await p.context().close();
  }
  console.log(JSON.stringify(res, null, 1)); fs.writeFileSync(__dirname + '/../proto/renders/hovercheck.json', JSON.stringify(res, null, 1));
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();
