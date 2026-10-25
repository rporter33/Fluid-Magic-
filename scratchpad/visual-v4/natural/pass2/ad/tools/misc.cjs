const { launch, open, ev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 894);
  const r = {};
  r.wildCls = await ev(p, `m.ev("(() => { const { LT, BW } = RB, c = RB.nat.cls, o = {}; for (let k = 0; k < LT.length; k += 7) { if (LT[k] === 7 || LT[k] === 8) { const key = LT[k] + ':' + c[k]; o[key] = (o[key] || 0) + 1; } } return o; })()")`);
  r.edgeStart = await ev(p, 'm.reliefWildEdge()');
  await ev(p, 'm.zoomTo(1.142, "Ashmoor")'); await p.waitForTimeout(800);
  r.edgeRef = await ev(p, 'm.reliefWildEdge()');
  r.labelsRef = await ev(p, `m.ev("(() => { const lay = RL_PIECE_CACHE.get('L'); const sh = rlLiveBox(lay); const caps = provs.filter(q => q.cap || (prov[q.i].owner && lay.seats.get(q.i))).map(q => q.i); return { names: lay.labels.map(l => l.text), deepmoss: (() => { const i = names.indexOf('Deepmoss'); const st = lay.seats.get(i); return { cap: !!prov[i].cap, owner: prov[i].owner, seatScreen: st ? [st.x * rlLayK(lay) + cam.x, st.y * rlLayK(lay) + cam.y] : null, labelled: lay.labels.some(l => l.i === i), ctl: rlControlsLeft() }; })() }; })()")`);
  r.capitals = await ev(p, `m.ev("provs.filter(q => q.cap).map(q => q.name)")`);
  console.log(JSON.stringify(r, null, 1)); console.log('pageErrors', log.pageErrors);
  await b.close();
})();
