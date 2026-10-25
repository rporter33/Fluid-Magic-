const page = await open(1920, 1080);
await page.waitForTimeout(500);
const rep = await page.evaluate(async () => await window.__battle.checks());
fs.writeFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/checks-v4.1.json', JSON.stringify(rep, null, 1));
return { ok: rep.ok, pageErrors: rep.pageErrors, clock: rep.clock.ok, textures: rep.textures, battles: rep.battles.map((b) => [b.key, b.figureMismatches.length, b.cardMismatches.length, b.bodiesOk, b.winnerOk, b.deterministic, b.rerunMatches, b.overlap.framesWithOverlap, b.pick.tried, b.pick.wrong.length, b.colors.ok, b.colors.deltaE, b.build]), timing: rep.frameTiming.map((f) => [f.battle, f.speed, f.updateP50, f.updateP95, f.renderCpuP50, f.renderCpuP95, f.cpuP95, f.gpuWaitP50]) };
