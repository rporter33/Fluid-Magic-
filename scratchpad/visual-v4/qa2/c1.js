const page = await open(1280, 720);
const r = await page.evaluate(async () => { const rep = await window.__battle.checks({ timing: false }); return { ok: rep.ok, errs: rep.pageErrors, b: rep.battles.map((b) => ({ k: b.key, fig: b.figureMismatches.length, card: b.cardMismatches.length, fs: b.figureMismatches.slice(0,3), cs: b.cardMismatches.slice(0,3), bodies: [b.deaths, b.bodiesAtEnd], win: b.winnerOk, det: b.deterministic })) }; });
return r;
