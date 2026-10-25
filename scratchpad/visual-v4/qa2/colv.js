const out = {};
for (const variant of ['base', 'light', 'mid']) {
  const page = await open(1920, 1080);
  out[variant] = {};
  for (const k of ['a', 'b', 'c']) {
    const pts = await page.evaluate(([k, variant]) => {
      const base = basePalette;
      window.paletteFor = function (B, side) {
        const pal = base(B, side); const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
        const dark = { ...pal, cloth: pal.clothDark, clothLight: pal.cloth, clothDark: shade(pal.clothDark, -0.3), variant: 'dark' };
        const light = { ...pal, cloth: pal.clothLight, clothDark: pal.cloth, clothLight: shade(pal.clothLight, 0.2), variant: 'light' };
        if (side === far) return variant === 'dark' || variant === 'nearLightFarDark' ? dark : variant === 'light' ? light : variant === 'mid' ? { ...pal, cloth: mix(pal.cloth, pal.clothLight, 0.55), clothDark: mix(pal.clothDark, pal.cloth, 0.5), variant: 'mid' } : pal;
        return variant === 'nearLight' || variant === 'nearLightFarDark' ? light : pal;
      };
      paletteFor = window.paletteFor; ATLAS_CACHE.clear();
      const G = window.__battle.game; G.load(k); G.playing = false; window.__battle.seek(2.2); G.render(2.2);
      const st = G.stage, T = st.T, w = st.world; const r = [];
      st.sprites.forEach((sp, i) => { if (!sp || !sp.visible) return; const Q = T.G[T.F[i].g]; if (Q.g.isCmd || Q.kind === 'cloud') return; r.push([Q.side === T.S.nearSide ? 'near' : 'far', Math.round(w.position.x + sp.x * w.scale.x), Math.round(w.position.y + (sp.y - 14) * w.scale.y), +(w.scale.x).toFixed(3)]); });
      return r; }, [k, variant]);
    await page.waitForTimeout(100);
    await page.screenshot({ path: `shots/colv-${variant}-${k}.png` });
    out[variant][k] = pts;
  }
  await page.close();
}
fs.writeFileSync('colvpts.json', JSON.stringify(out));
return Object.keys(out);
