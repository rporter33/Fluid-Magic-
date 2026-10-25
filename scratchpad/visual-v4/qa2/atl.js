const page = await open(960, 540);
return await page.evaluate(() => {
  const R = window.__battle.game.app.renderer; const out = {};
  const med = (tex) => { const { pixels } = R.extract.pixels(tex); const ch = [[], [], []]; for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] >= 250) { ch[0].push(pixels[i]); ch[1].push(pixels[i + 1]); ch[2].push(pixels[i + 2]); } const m = ch.map((a) => a.sort((x, y) => x - y)[a.length >> 1]); return (m[0] << 16) | (m[1] << 8) | m[2]; };
  const V = { base: (p) => p, mid: (p) => ({ ...p, cloth: mix(p.cloth, p.clothLight, 0.55), clothDark: mix(p.clothDark, p.cloth, 0.5) }), light: (p) => ({ ...p, cloth: p.clothLight, clothDark: p.cloth, clothLight: shade(p.clothLight, 0.2) }) };
  for (const B of DATA) {
    const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
    const rep = (side) => B.groups.filter((g) => g.side === side && !g.cmd && g.size < 3 && !['fireSprite', 'hornetSwarm'].includes(g.unit)).sort((a, b) => b.start - a.start)[0];
    const nu = rep(B.nearSide), fu = rep(far);
    const nf = bakeFigures(R, [{ key: 'tmpn', unit: nu.unit, pal: basePalette(B, B.nearSide) }]).get('tmpn');
    const nm = med(nf.ne[FR.idle]);
    const res = { near: [nu.unit, numToHex(nm), +lstar(nm).toFixed(1)], ground: +lstar(groundColor(B)).toFixed(1) };
    for (const [k, f] of Object.entries(V)) {
      const ff = bakeFigures(R, [{ key: 'tmpf', unit: fu.unit, pal: f(basePalette(B, far)) }]).get('tmpf');
      const fm = med(ff.se[FR.idle]);
      res[k] = [fu.unit, numToHex(fm), +lstar(fm).toFixed(1), deltaEBy(nm, fm)];
    }
    out[B.key] = res;
  }
  return out;
});
