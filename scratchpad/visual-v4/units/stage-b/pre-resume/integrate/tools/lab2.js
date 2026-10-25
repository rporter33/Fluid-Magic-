// The painted side-look lab (stage B critique fix 2): for each battle, every pair of side looks in PAINT_SIDE_SHIFT
// (Cinder only lightens, Thornwood only darkens; the C and vivid looks also lift chroma toward the side's own hue), in
// order of least change in value (|dL| summed over both sides; a chroma lift strengthens the side's own colour and is
// not counted as change), ties going to the look with more chroma (the critique: "vivid keeps them ember-orange", the
// lighter looks without it turn pastel). Each pair is measured in the page: the colour-blind rule (checkColors: CVD
// separation and the value rule), then the side colour at play zoom (checkSideShare, 30% per side). The first pair that
// passes both is the pick for PAINT_SIDE_LOOK_TABLE. A look that darkens by more than 0.05 must also lift chroma
// (critique fix 2: darkening alone clips the dark green's chroma and turns the Thornwood blocks near-black), so 'darker'
// and 'darkest' are not candidates. Writes integrate/lab-painted3.json.
const page = await open(1920, 1080, '?paused=1');
const r = await page.evaluate(() => {
  const G = window.__battle.game;
  const out = {};
  const cost = (nat, w) => Math.abs(PAINT_SIDE_SHIFT[nat][w][0]);
  const chroma = (nat, w) => PAINT_SIDE_SHIFT[nat][w][1];
  for (const b of DATA) {
    const key = sideLookKey(b), keep = PAINT_SIDE_LOOK_TABLE[key];
    const far = b.nearSide === 'attacker' ? 'defender' : 'attacker';
    const nN = b.sides[b.nearSide].def, nF = b.sides[far].def;
    const pairs = [];
    const allowed = (nat, w) => { const t = PAINT_SIDE_SHIFT[nat][w]; return !(t[0] < -0.05 && t[1] <= 1); };
    for (const n of Object.keys(PAINT_SIDE_SHIFT[nN])) for (const f of Object.keys(PAINT_SIDE_SHIFT[nF])) if (allowed(nN, n) && allowed(nF, f)) pairs.push({ n, f, cost: +(cost(nN, n) + cost(nF, f)).toFixed(3), chroma: chroma(nN, n) + chroma(nF, f) });
    pairs.sort((x, y) => x.cost - y.cost || y.chroma - x.chroma || (x.n + x.f).localeCompare(y.n + y.f));
    out[b.key] = { key, tries: [], pick: null, table: keep };
    for (const p of pairs) {
      PAINT_SIDE_LOOK_TABLE[key] = { near: p.n, far: p.f };
      G.load(b.key); G.playing = false;
      const c = G.checkColors(G.B);
      const row = { near: p.n, far: p.f, cost: p.cost, dE: c.deltaE, below: c.belowGround, colorsOk: c.ok };
      if (c.ok) {
        const s = G.checkSideShare();
        row.share = Object.values(s.sides).map((v) => v.sharePct);
        row.shareOk = Object.values(s.sides).every((v) => v.sharePct >= 30);
      }
      out[b.key].tries.push(row);
      if (row.colorsOk && row.shareOk) { out[b.key].pick = { near: p.n, far: p.f, cost: p.cost }; break; }
    }
    PAINT_SIDE_LOOK_TABLE[key] = keep;
  }
  return out;
});
fs.writeFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/lab-painted3.json', JSON.stringify(r, null, 1));
const brief = {};
for (const [k, v] of Object.entries(r)) brief[k] = { table: v.table, pick: v.pick, tried: v.tries.length, last: v.tries.slice(-3).map((t) => `${t.near}/${t.far} cost ${t.cost} p=${t.dE.protan} d=${t.dE.deutan} below=${t.below.join(',')} colors ${t.colorsOk} share ${t.share || '-'}`) };
return brief;
