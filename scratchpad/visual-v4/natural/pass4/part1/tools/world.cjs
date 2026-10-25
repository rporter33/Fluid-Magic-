// step 1: the world's data on a map, against the r2 reference: node world.cjs <tag> [query] -> out/world-<tag>.json
const { launch, open, ev, mev, PAGE, OUT, SP } = require('./lib.cjs'); const fs = require('fs');
const [tag, q = '', wait = 'ready'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, T0 = Date.now();
  const p = await open(b, PAGE, { log, q, settle: 1500, wait: wait === 'ready', timeout: 900000 });
  const r = { readyMs: p.__readyMs, regions: await ev(p, 'm.p4Regions()'), waters: await ev(p, 'm.p4WatersData()'), supply: await ev(p, 'm.p4SupplyData()'), det: await ev(p, 'm.p4Determinism()'), info: await mev(p, '({ provinces: provList.length, cells: N, edges: EDGE.size, W, H, bake: [RL_P.bakeW, RL_P.bakeH], wilds: WILDS.map((w) => w.name + ":" + w.cells.length), red: provList.filter((i) => owner[i] === "red").length, green: provList.filter((i) => owner[i] === "green").length, fog: [FOG.filter((f) => f === "unexplored").length, FOG.filter((f) => f === "outofsight").length], worldMs: P4W.ms, regionsMs: P4REG.ms })') };
  const ref = q.includes('vast') ? SP + '/visual-v4/natural/pass4/final/out-world-r2-vast.json' : SP + '/visual-v4/natural/pass4/final/out-world-r2-snap.json', R2 = JSON.parse(fs.readFileSync(ref, 'utf8'));
  const mine = r.regions.table.map((g) => [g.name, [...g.members].sort().join(',')]), theirs = R2.regions.map((g) => [g.name, [...g.provs].sort().join(',')]);
  r.vsR2 = { regionsEqual: JSON.stringify(mine.sort()) === JSON.stringify(theirs.sort()), regionCount: [mine.length, theirs.length], sizes: [r.regions.sizes.join(','), R2.regionSizes.join(',')], splits: [JSON.stringify(r.regions.splits), JSON.stringify(R2.splits)],
    rivers: [r.waters.rivers.map((x) => x.name + ':' + x.edges + ':' + x.to).join(' '), R2.rivers.map((x) => x.name + ':' + x.edges + ':' + x.to).join(' ')], roads: [r.waters.roadEdges, R2.roads.edges], bridges: [r.waters.bridges.length, R2.roads.bridges.length],
    varo: [r.supply.varo.text, R2.supply.varoAtAshfen.text], namesDiff: mine.filter((m) => !theirs.some((t) => t[0] === m[0])).map((m) => m[0]) };
  r.pageErrors = log.pageErrors; r.ms = Date.now() - T0; fs.writeFileSync(`${OUT}world-${tag}.json`, JSON.stringify(r, null, 1));
  console.log(JSON.stringify({ info: r.info, vsR2: r.vsR2, regionsPass: r.regions.pass, watersPass: r.waters.pass, supplyPass: r.supply.pass, detPass: r.det.pass, digest: r.det.digest, targets: r.waters.targets, varoReach: r.waters.varoReach, varoCrossings: r.waters.varoCrossings, bridges: r.waters.bridges, perr: log.pageErrors.length, readyMs: r.readyMs }, null, 1));
  await b.close(); })();
