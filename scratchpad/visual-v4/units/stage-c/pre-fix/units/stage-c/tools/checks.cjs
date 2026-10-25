// window.__battle.checks() in Painted and Procedural (each covers 1x and 4x), summarised with the stage C rows.
//   PAGE=<html> TIMING=0|1 node checks.cjs <out.json>
const fs = require('fs');
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
(async () => {
  const browser = await launch();
  const res = { page: process.env.PAGE, modes: {}, full: {} };
  for (const mode of ['painted', 'procedural']) {
    const { page, errors, ctx } = await openPage(browser, process.env.PAGE, '?paused=1' + (mode === 'procedural' ? '&fig=procedural' : ''));
    const timing = process.env.TIMING === '1';
    const r = await page.evaluate((timing) => window.__battle.checks({ timing, frames: 240 }), timing);
    const sum = (b) => ({ key: b.key, fig: b.figureMismatches.length, card: b.cardMismatches.length, phaseEnds: b.phaseEnds, bodies: [b.deaths, b.bodiesAtEnd, b.bodiesOk], winner: b.winnerOk, det: b.deterministic, rerun: b.rerunMatches, overlap: b.overlap.framesWithOverlap, pickWrong: b.pick.wrong.length, pickTried: b.pick.tried, colors: [b.colors.ok, b.colors.deltaE, b.colors.belowGround],
      paint: b.paint && { ok: b.paint.ok, all: b.paint.allPainted, troops: [b.paint.troopGroupsPainted, b.paint.troopGroups], cmd: [b.paint.commandersPainted, b.paint.commanders], sprites: [b.paint.spriteChecks, b.paint.spritesNotPainted] },
      faces: b.faces && { ok: b.faces.ok, n: b.faces.commanders, matched: b.faces.matched, bigs: b.faces.bigs },
      variation: b.variation && { ok: b.variation.ok, pairs: b.variation.pairs, ident: b.variation.identical },
      side: b.sideShare && { ok: b.sideShare.ok, s: Object.values(b.sideShare.sides || {}).map((s) => [s.nation, s.sharePct, (s.groups || []).map((g) => g.unit + ':' + g.share).join(' ')]) },
      dead: b.deadHandoff && { ok: b.deadHandoff.ok, n: b.deadHandoff.deaths },
      creatures: b.creatures && { ok: b.creatures.ok, n: [b.creatures.painted, b.creatures.groups], sprites: [b.creatures.spriteChecks, b.creatures.spritesNotPainted], list: b.creatures.list },
      bigHeights: b.bigHeights && { ok: b.bigHeights.ok, bodies: b.bigHeights.bodies },
      wolfFront: b.wolfFront && { ok: b.wolfFront.ok, frontShown: b.wolfFront.frontShown, changedOther: b.wolfFront.changedOther, unchangedFront: b.wolfFront.unchangedFront, notRestored: b.wolfFront.notRestored, why: b.wolfFront.why } });
    res.modes[mode] = { figures: r.figures, ok: r.ok, paintOk: r.paintOk, allPainted: r.allPainted, clock: r.clock.ok, textures: r.textures, pageErrors: r.pageErrors, battles: r.battles.map(sum),
      timing: r.frameTiming.map((x) => [x.battle, x.speed, x.updateP50, x.updateP95, x.renderCpuP50, x.renderCpuP95, x.cpuP50, x.cpuP95, x.gpuWaitP50]), consoleErrors: errors };
    res.full[mode] = r;
    process.stderr.write(mode + ' ok=' + r.ok + ' paintOk=' + r.paintOk + ' errors=' + r.pageErrors.length + '/' + errors.length + '\n');
    await ctx.close();
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
