const { launch, open, mev, ev, PAGE } = require('./lib.cjs');
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`;
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300 });
  for (const [n, st] of [['start', null], ['far', S('m.minScale()', 800, 500)]]) { if (st) { await ev(p, st); await p.waitForTimeout(900); }
    console.log(n, JSON.stringify(await mev(p, `(() => { RL_DBG.qeSamples = []; RL_WRIM.key = ''; rlQuietEdgeMap(); const smp = RL_DBG.qeSamples; RL_DBG.qeSamples = null;
      const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
      const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
      const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; };
      const rows = [];
      for (const [x, y, nx, ny, Wm, Gm] of smp) { const [sx, sy] = toScreen(x, y); if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
        const Wr = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), Gr = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wr || !Gr) continue;
        const i = provinceAt(x + nx * 8 / cam.s, y + ny * 8 / cam.s); rows.push({ eG: +dE2000(rgb2lab(Gr), rgb2lab(Gm)).toFixed(1), eW: +dE2000(rgb2lab(Wr), rgb2lab(Wm)).toFixed(1), Gr: rgb2lab(Gr).map(Math.round), Gm: rgb2lab(Gm).map(Math.round), Wr: rgb2lab(Wr).map(Math.round), Wm: rgb2lab(Wm).map(Math.round), prov: names[i], fog: fogOf(i) ?? '', sx: Math.round(sx), sy: Math.round(sy) }); }
      rows.sort((a, b) => b.eG - a.eG); const g = rows.slice(0, 8); rows.sort((a, b) => b.eW - a.eW); return { G: g, W: rows.slice(0, 8) }; })()`)));
  }
  await b.close(); })();
