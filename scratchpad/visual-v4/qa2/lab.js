const page = await open(1280, 720);
return await page.evaluate(() => ['a', 'b', 'c'].map((k) => { const r = window.__battle.lab(k); return [k, r.key, r.table, r.near, r.far, r.tried.map((x) => [x.near, x.far, x.deltaE.protan, x.deltaE.deutan, x.belowGround])]; }));
