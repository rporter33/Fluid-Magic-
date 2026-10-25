const page = await open(1600, 900, '?b=c&paused=1');
const r = await page.evaluate(() => { const G = window.__battle.game; const st = G.stage; return { paint: st.paintMode, why: st.paint && st.paint.why, bake: st.paint && st.paint.bakeMs, load: PAINTLIB.loadMs, groups: st.S.groups.map((g) => [g.unit, st.paint ? st.paint.lookOf[g.idx] : null]) }; });
const dir = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/shots-dev/';
const m = await page.evaluate(() => window.__battle.moments());
for (const [k, t] of [['deploy', m.deploy], ['clash', m.clash], ['rout', m.rout]]) {
  if (t === null) continue;
  await page.evaluate((t) => { window.__battle.seek(t); }, t);
  await page.screenshot({ path: dir + 'c-' + k + '.png' });
}
return { r, m };
