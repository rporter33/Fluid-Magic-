const page = await open(960, 540);
return await page.evaluate(() => { const G = window.__battle.game; const out = {}; G.load('b'); const T = G.stage.T;
 for (const Q of T.G) if (Q.side === 'attacker' && Q.kind !== 'commander') out[Q.g.unit] = { ext0: [Q.ext.u0, Q.ext.u1, Q.ext.d].map(Math.round), path: Q.path.slice(0, 8).map((s) => [s.t0.toFixed(2), s.t1.toFixed(2), s.x1.toFixed(0), s.y1.toFixed(0), s.e]) };
 return out; });
