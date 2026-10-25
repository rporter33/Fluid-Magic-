// Side looks experiment: can the far Thornwood keep its colour-blind separation without going near-black?
// Tries Thornwood darkening with a chroma lift, and a stronger Cinder lightening; reports CVD dE, value and far side share.
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G = window.__battle.game; const out = [];
  PAINT_SIDE_SHIFT.cinderHorde.lightest2 = [0.2, 1.1];
  PAINT_SIDE_SHIFT.thornwood.darkC = [-0.05, 1.3];
  PAINT_SIDE_SHIFT.thornwood.darkerC = [-0.08, 1.35];
  PAINT_SIDE_SHIFT.thornwood.baseC = [0, 1.35]; PAINT_SIDE_SHIFT.thornwood.darkestC = [-0.12, 1.3]; PAINT_SIDE_SHIFT.cinderHorde.lightest3 = [0.25, 1.12]; PAINT_SIDE_SHIFT.cinderHorde.vivid = [0.15, 1.25]; PAINT_SIDE_SHIFT.cinderHorde.vivid2 = [0.2, 1.3]; PAINT_SIDE_SHIFT.cinderHorde.vivid0 = [0.12, 1.25];
  const combos = { a: [['vivid', 'darkestC'], ['vivid2', 'darkerC'], ['vivid2', 'darkestC']], c: [['vivid0', 'darkC'], ['vivid', 'darkC']] };
  for (const k of Object.keys(combos)) {
    const B = DATA.find((b) => b.key === k), key = sideLookKey(B), keep = PAINT_SIDE_LOOK_TABLE[key];
    for (const [n, f] of combos[k]) {
      PAINT_SIDE_LOOK_TABLE[key] = { near: n, far: f };
      G.load(k); G.playing = false;
      const c = G.checkColors(G.B);
      const s = G.checkSideShare();
      const sides = Object.fromEntries(Object.entries(s.sides || {}).map(([sd, v]) => [sd, v.share !== undefined ? v.share : v]));
      out.push({ k, near: n, far: f, dE: c.deltaE, below: c.belowGround, ok: c.ok, nearC: c.nearRendered, farC: c.farRendered, share: Object.values(s.sides).map((v) => (v.near ? 'near ' : 'far ') + v.sharePct + ' ' + (v.groups || []).map((g) => g.unit + ':' + g.share).join(',')).join(' | ') });
    }
    PAINT_SIDE_LOOK_TABLE[key] = keep;
  }
  return out;
});
