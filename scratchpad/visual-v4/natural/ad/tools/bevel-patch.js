// runtime prototype (review only): the neutral hairline as a lit bevel. Each half is solved against its own side only:
// the upper-left half prefers the light key, the lower-right half the dark key (the model's light comes from the upper left);
// a half whose preferred key cannot reach the floor on a third of its segments takes the other key for the whole edge (no flips along an edge).
window.__bevelSeg = function (e, kind, ctx) {
  if (kind !== 'hair') return __seg0(e, kind, ctx);
  const ck = ctx.key + '|bevel|' + e.i + '-' + e.j; let v = RL_LINES.cache.get(ck); if (v) return v;
  const LP = RL_P.line, [ax, ay] = e.a, [bx, by] = e.b, Lw = Math.hypot(bx - ax, by - ay) || 1, n = Math.max(1, Math.ceil(Lw / (LP.segD * RLD)));
  let nx = -(by - ay) / Lw, ny = (bx - ax) / Lw; if (nx + ny < 0) { nx = -nx; ny = -ny; }
  const T = window.__BV.T, cov = window.__BV.cov, q = window.__BV.q, pq = (a) => (a.length ? [rlQ(a, q), rlQ(a, 1 - q)] : []);
  const S = []; for (let s = 0; s < n; s++) { const x0 = ax + ((bx - ax) * s) / n, y0 = ay + ((by - ay) * s) / n, x1 = ax + ((bx - ax) * (s + 1)) / n, y1 = ay + ((by - ay) * (s + 1)) / n, [lr, ul, on] = rlGroundSides(x0, y0, x1, y1, nx, ny, ctx.look, ctx.lvl, ctx.states); S.push({ x0, y0, x1, y1, lr: pq(lr), ul: pq(ul), on: on.length ? [on[0], on[on.length - 1]] : [] }); }
  const half = (side, pref) => { const other = pref === 'light' ? 'dark' : 'light', G = (sg) => [...sg[side], ...sg.on];
    const a1 = S.map((sg) => rlAlphaFor(G(sg), RL_KEYS[pref], T, cov, 1)), ok1 = a1.filter((a) => a != null).length;
    if (ok1 >= S.length * 2 / 3) return { key: pref, al: a1.map((a) => a ?? 1) };
    const a2 = S.map((sg) => rlAlphaFor(G(sg), RL_KEYS[other], T, cov, 1)), ok2 = a2.filter((a) => a != null).length;
    return ok2 > ok1 ? { key: other, al: a2.map((a) => a ?? 1) } : { key: pref, al: a1.map((a) => a ?? 1) }; };
  const U = half('ul', 'light'), Lr = half('lr', 'dark');
  const segs = S.map((sg, s) => ({ x0: sg.x0, y0: sg.y0, x1: sg.x1, y1: sg.y1, key: U.key, alpha: U.al[s], partner: null, bevel: { ul: { key: U.key, a: U.al[s] }, lr: { key: Lr.key, a: Lr.al[s] } } }));
  v = { segs, key: U.key, nx, ny }; RL_LINES.cache.set(ck, v); return v;
};
