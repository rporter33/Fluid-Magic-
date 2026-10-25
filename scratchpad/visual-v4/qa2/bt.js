const page = await open(1920, 1080);
return await page.evaluate(() => { const G = window.__battle.game; const out = []; for (const k of ['b', 'c', 'a', 'b']) { G.load(k); out.push([k, G.buildMs]); } return out; });
