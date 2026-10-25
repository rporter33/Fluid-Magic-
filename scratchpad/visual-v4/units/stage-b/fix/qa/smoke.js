const out = {};
const dir = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix/qa/';
const page = await open(1920, 1080, '?paused=1');
for (const k of ['a', 'b', 'c']) {
  const m = await page.evaluate((k) => { const G = window.__battle.game; G.load(k); G.playing = false; return G.moments(); }, k);
  for (const [n, t] of [['deploy', m.deploy], ['clash', m.clash]]) {
    if (t === null || t === undefined) continue;
    await page.evaluate((t) => { window.__battle.seek(t); }, t);
    await page.waitForTimeout(300);
    await page.screenshot({ path: dir + `smoke-${k}-${n}.png` });
  }
  out[k] = await page.evaluate(() => { const st = window.__battle.game.stage; return { tier: st.paint.tier, Hbaked: st.paint.tex.H.size, gen: st.genBanners.length, blocks: st.blockBanners.filter(Boolean).length, genVis: st.genBanners.filter((b) => b.root.visible).length }; });
}
return out;
