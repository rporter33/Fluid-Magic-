const page = await open(1920, 1080);
await page.waitForTimeout(500);
const r = await page.evaluate(async () => { const rep = await window.__battle.checks({ timing: false }); return { ok: rep.ok, errs: rep.pageErrors, clock: rep.clock, textures: rep.textures, b: rep.battles.map((b) => ({ k: b.key, fig: b.figureMismatches.length, card: b.cardMismatches.length, bodies: [b.deaths, b.bodiesAtEnd], win: b.winnerOk, det: b.deterministic, overlap: b.overlap, pick: b.pick, colors: b.colors })) }; });
return r;
