const page = await open(1920, 1080, '?paused=1');
const r = await page.evaluate(() => {
  const G = window.__battle.game;
  const out = {};
  const W = ['base', 'mid', 'light', 'dark'];
  for (const b of DATA) {
    const key = sideLookKey(b);
    out[b.key] = { key, tries: [] };
    for (const n of W) for (const f of W) {
      PAINT_SIDE_LOOK_TABLE[key] = { near: n, far: f };
      G.load(b.key); G.playing = false;
      const c = G.checkColors(G.B);
      out[b.key].tries.push({ near: n, far: f, dE: c.deltaE, below: c.belowGround, nearC: c.nearRendered, farC: c.farRendered, ok: c.ok });
    }
    delete PAINT_SIDE_LOOK_TABLE[key];
  }
  return out;
});
fs.writeFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/lab-painted.json', JSON.stringify(r, null, 1));
const brief = {};
for (const [k, v] of Object.entries(r)) brief[k] = v.tries.map((t) => `${t.near}/${t.far} min=${Math.min(...Object.values(t.dE)).toFixed(1)} p=${t.dE.protan} d=${t.dE.deutan} t=${t.dE.tritan} below=${t.below.join(',')} ${t.ok ? 'OK' : ''}`);
return brief;
