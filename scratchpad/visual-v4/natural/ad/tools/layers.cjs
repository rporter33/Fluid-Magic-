// AD review: what each layer adds to the clutter. Runtime-only switches in a private browser (the mockup file is not edited).
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  await ev(p, `m.ev("window.__o = { seg: rlSegStyles, ham: rlHamlet, hut: rlHut }; 'ok'")`);
  const set = async (o) => ev(p, `m.ev(${JSON.stringify(`
    rlSegStyles = ${o.hair ? '__o.seg' : `function (e, kind, ctx) { const r = __o.seg(e, kind, ctx); if (kind !== 'hair') return r; return { ...r, segs: r.segs.map((s) => ({ ...s, alpha: 0, partner: null })) }; }`};
    rlHamlet = ${o.ham ? '__o.ham' : 'function () {}'};
    SKIP.delete('labels'); SKIP.delete('pieces'); SKIP.delete('rails'); SKIP.delete('water');
    ${o.labels ? '' : "SKIP.add('labels');"} ${o.pieces ? '' : "SKIP.add('pieces');"} ${o.rails ? '' : "SKIP.add('rails');"} ${o.water ? '' : "SKIP.add('water');"}
    RL_LINES.cache.clear(); RCK = null; draw(); 'ok'`)})`);
  const views = { start: 'm.ev("fit(); draw()")', mid: 'm.setScale(1.0, 640, 480)', refC: 'm.setScale(1.142, 700, 560)', refW: 'm.setScale(1.142, 400, 420)' };
  const V = { all: { hair: 1, ham: 1, labels: 1, pieces: 1, rails: 1, water: 1 }, nohair: { hair: 0, ham: 1, labels: 1, pieces: 1, rails: 1, water: 1 }, nohamlet: { hair: 1, ham: 0, labels: 1, pieces: 1, rails: 1, water: 1 }, nolabels: { hair: 1, ham: 1, labels: 0, pieces: 1, rails: 1, water: 1 }, landonly: { hair: 1, ham: 0, labels: 0, pieces: 0, rails: 0, water: 1 } };
  for (const [vn, vs] of Object.entries(views)) {
    await ev(p, vs);
    for (const [k, o] of Object.entries(V)) { await set(o); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}L-${vn}-${k}.png` }); console.log('shot', vn, k); }
    await set(V.all);
  }
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
