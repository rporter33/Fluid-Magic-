// Runtime-only companion changes for the headless render (evaluated in the page closure through __mock.ev; no part file is edited).
// 1 paper tooth 128 +-20 -> +-28 (fine octave 12 -> 17, coarse 8 -> 11), soft-light 0.5 kept;
// 2 granulation on the light yellows: plains 0.25 -> 0.5, farmland 0.2 -> 0.45.
// The edge pool keeps f - 28 L* at 0.45 and the mottle keeps today's amplitudes (both measured: no headroom under this palette).
(() => {
  const swap = (fnSrc, pairs) => { let s = fnSrc; for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('missing: ' + a); s = s.split(a).join(b); } return s; };
  paperTile = eval('(' + swap(paperTile.toString(), [['vnoiseTile(S, R, 170, 12)', 'vnoiseTile(S, R, 170, 17)'], ['vnoiseTile(S, R, 6, 8)', 'vnoiseTile(S, R, 6, 11)']]) + ')');
  PAPER = null;
  PAINT.plains.G = 0.5; PAINT.farmland.G = 0.45;
  invalidateBakes(); refreshKeys(); requestDraw();
})()
