const mode = process.env.FIG || 'painted';
const page = await open(1920, 1080, '?paused=1' + (mode === 'procedural' ? '&fig=procedural' : ''));
const r = await page.evaluate(() => window.__battle.checks({ timing: true, frames: 240 }));
fs.writeFileSync(`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix/qa/checks-${mode}-after.json`, JSON.stringify(r, null, 1));
return { mode: r.figures, ok: r.ok, paintOk: r.paintOk, allPainted: r.allPainted, timing: r.frameTiming.map((x) => [x.battle, x.speed, x.updateP50, x.updateP95, x.renderCpuP50, x.renderCpuP95, x.cpuP50, x.cpuP95, x.gpuWaitP50]), colors: r.battles.map((b) => [b.key, b.colors.ok, b.colors.deltaE]), side: r.battles.map((b) => b.sideShare && Object.values(b.sideShare.sides).map((s) => [s.nation, s.sideLook, s.sharePct])) };
