// final verifier's shots: node fshots.cjs <fx|f3|p2> <session...>; identical world-centred cameras on every build
// each view: the full frame <key>-<name>.png and the land layer (rails, pieces, labels, badges, arrows skipped) <key>-<name>-land.png
const { launch, open, ev, mev, PAGES } = require('./lib.cjs'); const fs = require('fs');
const SHOTS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/shots/';
const A = [491.96, 239.47], M = [911.91, 588.11], G = [640.42, 676.33];
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, X = (k, c) => `m.setScale(m.maxScale() * ${k}, ${c[0]}, ${c[1]})`, FIT = 'm.ev("fit(); RCK = null; draw()")';
const SESS = {
  main: { views: [['01-start', null], ['02-far60', S('60 / m.ev("MED_DIAM")', 720, 450)], ['02b-least', S('m.minScale()', 800, 500)], ['03-mid', S(1.0, 640, 480)], ['03b-mid-ash', S(1.0, ...A)], ['03c-mid-grey-mere', S(1.0, 780, 640)], ['04-ref', S(1.142, 700, 560)],
    ['05-near-ash', X(0.55, A)], ['06-near-grey', X(0.6, G)], ['07-near-mere', X(0.6, M)], ['08-max-ash', X(1.0, A)], ['08b-max-ash-west', X(1.0, [330, 230])], ['08c-max-ash-east', X(1.0, [650, 250])], ['09-max-grey', X(1.0, G)], ['10-max-mere', X(1.0, M)], ['11-fit', FIT]] },
  cmp: { views: [['01-start', null], ['02-far60', S('60 / m.ev("MED_DIAM")', 720, 450)], ['03b-mid-ash', S(1.0, ...A)], ['03c-mid-grey-mere', S(1.0, 780, 640)], ['05-near-ash', X(0.55, A)], ['06-near-grey', X(0.6, G)], ['07-near-mere', X(0.6, M)], ['08-max-ash', X(1.0, A)], ['09-max-grey', X(1.0, G)], ['10-max-mere', X(1.0, M)]] },
  clear: { q: '?terrain=clear', views: [['20-clear-start', null], ['21-clear-mid-wilds', S(1.0, 700, 450)], ['22-clear-near-ash', X(0.55, A)], ['22b-clear-near-grey', X(0.6, G)]] },
  terrain: { mode: 'terrain', views: [['23-terrain-start', null], ['23b-terrain-near-ash', X(0.55, A)]] },
  supply: { mode: 'supply', views: [['24-supply-start', null], ['24b-supply-mid-ash', S(1.0, ...A)]] },
  phone: { w: 390, h: 844, dpr: 3, views: [['30-phone-start', null], ['31-phone-fit', FIT], ['32-phone-mid-ash', S(1.0, ...A)], ['33-phone-near-grey', X(0.6, G)], ['34-phone-near-mere', X(0.6, M)]] },
  phoneclear: { w: 390, h: 844, dpr: 3, q: '?terrain=clear', views: [['35-phone-clear-start', null]] },
  dpr2: { dpr: 2, views: [['40-dpr2-start', null], ['41-dpr2-near-ash', X(0.55, A)], ['42-dpr2-max-grey', X(1.0, G)], ['43-dpr2-max-mere', X(1.0, M)], ['43b-dpr2-least', S('m.minScale()', 800, 500)]] },
  small: { w: 1280, h: 720, views: [['44-1280-start', null]] },
  big: { w: 1920, h: 1080, views: [['45-1920-start', null]] },
  talus: { q: '?wildfoot=talus', views: [['50-talus-start', null], ['51-talus-mid-wilds', S(1.0, 700, 450)], ['52-talus-near-grey', X(0.6, G)], ['53-talus-near-mere', X(0.6, M)], ['54-talus-max-ash', X(1.0, A)]] },
  ink2: { q: '?wildink=2', views: [['55-ink2-start', null], ['56-ink2-near-grey', X(0.6, G)]] },
};
(async () => {
  const key = process.argv[2], file = PAGES[key], which = process.argv.slice(3), b = await launch(); const errs = [];
  for (const nm of which) {
    const C = SESS[nm], W = C.w ?? 1440, H = C.h ?? 900, log = { pageErrors: [] };
    const p = await open(b, file, { log, dpr: C.dpr ?? 1, w: W, h: H, settle: 2000, q: C.q ?? '' });
    await p.mouse.move(W / 2, H - 4);
    if (C.mode) { await mev(p, `setMode('${C.mode}')`); if (C.mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await p.waitForTimeout(1500); }
    for (const [name, step] of C.views) {
      if (step) await ev(p, step);
      await p.waitForTimeout(2600); await p.screenshot({ path: `${SHOTS}${key}-${name}.png` });
      await mev(p, "for (const k of ['rails','pieces','labels','badges','arrows']) SKIP.add(k); RCK = null; draw();"); await p.waitForTimeout(400);
      await p.screenshot({ path: `${SHOTS}${key}-${name}-land.png` });
      await mev(p, "SKIP.clear(); RCK = null; draw();"); await p.waitForTimeout(300);
      const info = await ev(p, '[m.band(), +(m.scale() * m.ev("MED_DIAM")).toFixed(1), (() => { const E = m.reliefWildEdge(); return [E.samples, E.fails, E.rim && E.rim.quietEdgeShare]; })()]');
      console.log('shot', key, name, JSON.stringify(info));
    }
    errs.push(...log.pageErrors); await p.context().close();
  }
  console.log('pageErrors', errs.length, JSON.stringify(errs.slice(0, 3))); await b.close();
})();
