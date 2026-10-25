const mode = process.env.FIG || 'painted';
const timing = process.env.TIMING !== '0';
const page = await open(1920, 1080, '?paused=1' + (mode === 'procedural' ? '&fig=procedural' : ''));
const r = await page.evaluate((timing) => window.__battle.checks({ timing, frames: 240 }), timing);
fs.writeFileSync(`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix2/qa/checks-${mode}.json`, JSON.stringify(r, null, 1));
const sum = (b) => ({ key: b.key, fig: b.figureMismatches.length, card: b.cardMismatches.length, phaseEnds: b.phaseEnds, bodies: [b.deaths, b.bodiesAtEnd, b.bodiesOk], winner: b.winnerOk, det: b.deterministic, rerun: b.rerunMatches, overlap: b.overlap.framesWithOverlap, pick: [b.pick.wrong.length, b.pick.total || b.pick.n || null], colors: [b.colors.ok, b.colors.deltaE, b.colors.belowGround, b.colors.variants],
  paint: b.paint && { ok: b.paint.ok, all: b.paint.allPainted, troops: [b.paint.troopGroupsPainted, b.paint.troopGroups], cmd: [b.paint.commandersPainted, b.paint.commanders], notPainted: b.paint.notPainted, sprites: [b.paint.spriteChecks, b.paint.spritesNotPainted], standIn: b.paint.standInMoments, reported: b.paint.reported.map((x) => x.look + '.' + x.view) },
  faces: b.faces && { ok: b.faces.ok, n: b.faces.commanders, matched: b.faces.matched, mism: b.faces.mismatches, noArt: b.faces.noArt },
  variation: b.variation && { ok: b.variation.ok, pairs: b.variation.pairs, ident: b.variation.identical, f: b.variation.differFramePct, v: b.variation.differVariantPct, t: b.variation.differTintPct, tm: b.variation.differTimingPct },
  side: b.sideShare && { ok: b.sideShare.ok, s: Object.values(b.sideShare.sides || {}).map((s) => [s.nation, s.near ? 'near' : 'far', s.sideLook, s.sharePct, s.groups.map((g) => g.unit + ':' + g.share).join(' ')]) },
  dead: b.deadHandoff && { ok: b.deadHandoff.ok, n: b.deadHandoff.deaths, first: b.deadHandoff.first, mis: [b.deadHandoff.texMismatch, b.deadHandoff.mirrorMismatch, b.deadHandoff.rotErr, b.deadHandoff.posErr] },
  build: b.paintBuild });
return { mode: r.figures, ok: r.ok, paintOk: r.paintOk, allPainted: r.allPainted, clock: r.clock.ok, textures: r.textures, pageErrors: r.pageErrors, battles: r.battles.map(sum),
  timing: r.frameTiming.map((x) => [x.battle, x.speed, x.updateP50, x.updateP95, x.renderCpuP50, x.renderCpuP95, x.cpuP50, x.cpuP95, x.gpuWaitP50]) };
