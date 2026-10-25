const page = await open(1920, 1080);
const out = {};
for (const k of ['a', 'b', 'c']) {
  const pts = await page.evaluate((k) => { const G = window.__battle.game; G.load(k); G.playing = false; window.__battle.seek(2.2); G.render(2.2);
    const st = G.stage, T = st.T, w = st.world; const r = [];
    st.sprites.forEach((sp, i) => { if (!sp || !sp.visible) return; const Q = T.G[T.F[i].g]; if (Q.g.isCmd || Q.kind === 'cloud') return; r.push([Q.side === T.S.nearSide ? 'near' : 'far', Math.round(w.position.x + sp.x * w.scale.x), Math.round(w.position.y + (sp.y - 14) * w.scale.y), +(w.scale.x).toFixed(3)]); });
    return r; }, k);
  await page.waitForTimeout(100);
  await page.screenshot({ path: `shots/col-${k}.png` });
  out[k] = pts;
}
fs.writeFileSync('colpts.json', JSON.stringify(out));
return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length]));
