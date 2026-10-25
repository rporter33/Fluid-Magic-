// the start shift at 1280x720: per dy, wild samples and seats under the ribbon, wild samples under the bottom panel
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w: 1280, h: 720, settle: 1500 }); await p.mouse.move(640, 716);
  const r = await mev(p, `(() => { const s = startScale(); const rb = document.getElementById('ribbon'); const R = rb.getBoundingClientRect(), cr = canvas.getBoundingClientRect(); const v = viewRect(), mx = (v.l + v.r) / 2, my = (v.t + v.b) / 2;
    const box = [R.left - cr.left - 6, R.top - cr.top - 6, R.right - cr.left + 6, R.bottom - cr.top + 6], D = MED_DIAM * s; const c = [(cam.x - mx) / -cam.s, (cam.y - my) / -cam.s];
    const out = []; for (let dy = -120; dy <= 160; dy += 8) { const cy = c[1] - dy / s; let rw = 0, rs = 0, bw = 0, top = 0;
      for (let y = box[1]; y <= box[3]; y += 4) for (let x = box[0]; x <= box[2]; x += 4) { const wx = c[0] + (x - mx) / s, wy = cy + (y - my) / s; if (wx >= 0 && wy >= 0 && wx <= W && wy <= H && isWild(provinceAt(wx, wy))) rw++; }
      for (const i of provList) { if (isWild(i)) continue; const sx = mx + (cent[i][0] - c[0]) * s, sy = my + (cent[i][1] - cy) * s, d = 0.3 * D; if (sx > box[0] - d && sx < box[2] + d && sy > box[1] - d && sy < box[3] + d) rs++; }
      for (let y = v.b + 2; y <= v.b + 80; y += 4) for (let x = v.l; x <= v.r; x += 4) { const wx = c[0] + (x - mx) / s, wy = cy + (y - my) / s; if (wx >= 0 && wy >= 0 && wx <= W && wy <= H && isWild(provinceAt(wx, wy))) bw++; }
      out.push([dy, rw, rs, bw]); }
    return { s, D, box, v, out }; })()`);
  console.log(JSON.stringify({ s: r.s, D: r.D, box: r.box, v: r.v })); for (const o of r.out) console.log(o.join('\t')); await b.close();
})();
