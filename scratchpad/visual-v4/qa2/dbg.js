const page = await open(960, 540);
return await page.evaluate(() => { const G = window.__battle.game; const out = {}; for (const k of ['a','b']) { G.load(k); const T = G.stage.T; out[k] = T.dbg.slice(0, 12).map((d) => JSON.stringify(d));
 const m = T.G.find((q) => q.g.unit === (k === 'a' ? 'ashMilitia' : 'warden')); out[k + 'path'] = m.path.map((s) => [s.t0.toFixed(2), s.t1.toFixed(2), s.x1.toFixed(0), s.y1.toFixed(0)]); } return out; });
