// the decision's modelled W and G against the rendered pixels at the same offsets (static layer, no pieces or labels)
const { launch, open, mev, ev, PAGE } = require('./lib.cjs');
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, MAX = (k, x, y) => `m.setScale(m.maxScale() * ${k}, ${x}, ${y})`;
const V = [['start', null], ['far', S('m.minScale()', 800, 500)], ['mid', S(1.0, 640, 480)], ['nearAsh', MAX(0.55, 490, 237)], ['maxAsh', MAX(1.0, 520, 230)]];
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 300, dpr: +(process.env.DPR || 1) });
  for (const [n, st] of V) { if (st) { await ev(p, st); await p.waitForTimeout(900); }
    console.log(n, JSON.stringify(await mev(p, `(() => { RL_DBG.qeSamples = []; RL_WRIM.key = ''; rlQuietEdgeMap(); const smp = RL_DBG.qeSamples; RL_DBG.qeSamples = null;
      const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
      const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
      const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; };
      const eW = [], eG = [], dLW = [], dLG = [];
      for (const [x, y, nx, ny, Wm, Gm] of smp) { const [sx, sy] = toScreen(x, y); if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue; const nxs = nx, nys = ny; // the normal is the same in screen space (uniform scale)
        const Wr = med([6, 7, 8, 9].map((o) => px(sx - nxs * o, sy - nys * o))), Gr = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nxs * o, sy + nys * o))); if (!Wr || !Gr) continue;
        eW.push(dE2000(rgb2lab(Wr), rgb2lab(Wm))); eG.push(dE2000(rgb2lab(Gr), rgb2lab(Gm))); dLW.push(rgb2lab(Wr)[0] - rgb2lab(Wm)[0]); dLG.push(rgb2lab(Gr)[0] - rgb2lab(Gm)[0]); }
      const q = (a, f) => { const s = [...a].sort((p, q) => p - q); return s.length ? +s[Math.min(s.length - 1, Math.floor(f * s.length))].toFixed(2) : null; };
      return { n: eW.length, dEW: [q(eW, 0.5), q(eW, 0.9), q(eW, 0.99)], dEG: [q(eG, 0.5), q(eG, 0.9), q(eG, 0.99)], dLW: [q(dLW, 0.01), q(dLW, 0.5), q(dLW, 0.99)], dLG: [q(dLG, 0.01), q(dLG, 0.5), q(dLG, 0.99)] }; })()`)));
  }
  await b.close(); })();
