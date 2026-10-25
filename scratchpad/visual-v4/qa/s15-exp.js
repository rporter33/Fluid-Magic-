const page = await open(1920, 1080);
const out = {};
// (a) denser, deeper formations (runtime patch only; the page file is untouched)
out.before = await page.evaluate(() => { const G = window.__battle.game; G.load('a'); const L = G.stage.L; return L.groups.filter((x) => x.kind !== 'commander' && x.kind !== 'body').map((x) => [x.g.unit, x.kind, Math.round(x.ext.w), Math.round(x.ext.d)]); });
out.after = await page.evaluate(() => {
  Object.assign(FORM.line, { ranks: (n) => clamp(Math.round(Math.sqrt(n / 1.5)), 3, 10), fs: 13, rs: 12 });
  Object.assign(FORM.heavy, { ranks: (n) => clamp(Math.round(Math.sqrt(n / 1.2)), 4, 10), fs: 13, rs: 12 });
  Object.assign(FORM.shock, { ranks: (n) => clamp(Math.round(Math.sqrt(n / 1.5)), 3, 8), fs: 15, rs: 14, jit: 3 });
  Object.assign(FORM.archers, { ranks: (n) => clamp(Math.round(Math.sqrt(n / 3)), 2, 5), fs: 16, rs: 15 });
  Object.assign(FORM.wedge, { fs: 20, rs: 22 });
  const G = window.__battle.game; G.load('a'); const L = G.stage.L; return L.groups.filter((x) => x.kind !== 'commander' && x.kind !== 'body').map((x) => [x.g.unit, x.kind, Math.round(x.ext.w), Math.round(x.ext.d)]); });
for (const [k, mname, dt, nm] of [['a', 'deploy', 0, 'deploy'], ['a', 'clash', 1.5, 'clash'], ['c', 'clash', 1, 'clash']]) {
  await page.evaluate(([k, mname, dt]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); G.follow = true; G.user = null; const m = window.__battle.moments(); window.__battle.seek(m[mname] + dt); }, [k, mname, dt]);
  await page.waitForTimeout(80);
  await page.screenshot({ path: `shots/x-dense-${k}-${nm}.png` });
}
out.checks = await page.evaluate(() => { const r = window.__battle.game.checkBattle('a'); return { fig: r.figureMismatches.length, card: r.cardMismatches.length, bodies: r.bodiesOk, winner: r.winnerOk }; });
return out;
