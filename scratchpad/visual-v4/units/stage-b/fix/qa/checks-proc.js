const page = await open(1920, 1080, '?paused=1&fig=procedural');
const r = await page.evaluate(() => window.__battle.checks({ timing: false }));
fs.writeFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix/qa/checks-procedural-after.json', JSON.stringify(r, null, 1));
return { mode: r.figures, ok: r.ok, battles: r.battles.map((b) => [b.key, b.figureMismatches.length, b.cardMismatches.length, b.deterministic, b.rerunMatches, b.colors.ok, b.overlap.framesWithOverlap, b.pick.wrong.length]), errors: r.pageErrors };
