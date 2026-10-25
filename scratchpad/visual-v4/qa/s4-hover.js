const page = await open(1920, 1080);
const out = {};
const hoverGroup = async (unit, name, dx, dy) => {
  const pt = await page.evaluate((u) => { const g = window.__battle.groups().find((x) => x.unit === u); if (!g) return null; const G = window.__battle.game; G.render(G.t);
    if (g.big || g.cmd) { const st = G.stage; const bb = st.bigs.find((b) => b.G.idx === g.idx); if (bb) { const b = bb.body.root.getBounds(); return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, gi: g.idx }; } const sp = st.sprites[st.T.G[g.idx].figs[0]]; const w = st.world; return { x: w.position.x + sp.x * w.scale.x, y: w.position.y + (sp.y - 14) * w.scale.y, gi: g.idx }; }
    const s = window.__battle.screenOf(g.idx); return s ? { ...s, gi: g.idx } : null; }, unit);
  if (!pt) return null;
  await page.mouse.move(pt.x + (dx || 0), pt.y + (dy || 0));
  await page.waitForTimeout(120);
  const info = await page.evaluate(() => { const G = window.__battle.game; const h = document.getElementById('hover'); const r = h.getBoundingClientRect(); return { hover: G.view.hover, shown: h.classList.contains('show'), text: h.innerText, rect: [r.left, r.top, r.width, r.height] }; });
  await page.screenshot({ path: `shots/h-${name}.png` });
  return { pt, ...info };
};
await page.evaluate(() => window.__battle.load('a'));
let m = await page.evaluate(() => window.__battle.moments());
await page.evaluate((t) => window.__battle.seek(t), m.clash + 1.5);
out.a_cinderWarrior = await hoverGroup('cinderWarrior', 'a-squad');
out.a_wyrm = await hoverGroup('greatWyrm', 'a-wyrm');
out.a_wardenCaptain = await hoverGroup('wardenCaptain', 'a-captain');
out.a_flameArcher = await hoverGroup('flameArcher', 'a-archers');
// hover a card in the bar
const cardPt = await page.evaluate(() => { const c = [...document.querySelectorAll('#bar .card')][1]; const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await page.mouse.move(cardPt.x, cardPt.y); await page.waitForTimeout(150);
out.a_card = await page.evaluate(() => { const h = document.getElementById('hover'); const r = h.getBoundingClientRect(); return { shown: h.classList.contains('show'), text: h.innerText, rect: [r.left, r.top, r.width, r.height], hover: window.__battle.game.view.hover }; });
await page.screenshot({ path: 'shots/h-a-card.png' });
await page.mouse.move(5, 500);
await page.evaluate(() => window.__battle.load('b'));
m = await page.evaluate(() => window.__battle.moments());
await page.evaluate((t) => window.__battle.seek(t), m.clash + 2);
out.b_cinderWarrior = await hoverGroup('cinderWarrior', 'b-wall');
out.b_treant = await hoverGroup('treant', 'b-treant');
await page.mouse.move(5, 500);
await page.evaluate(() => window.__battle.load('c'));
m = await page.evaluate(() => window.__battle.moments());
await page.evaluate((t) => window.__battle.seek(t), m.clash + 1);
out.c_salamander = await hoverGroup('salamander', 'c-salamander');
out.c_hornet = await hoverGroup('hornetSwarm', 'c-hornet');
out.c_fireSprite = await hoverGroup('fireSprite', 'c-sprite');
return out;
