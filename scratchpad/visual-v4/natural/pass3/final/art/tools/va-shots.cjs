// verify-art shots: node shots.cjs <p3|p2> <session...>; identical world-centred cameras on both builds
// each view: full frame <key>-<name>.png and the land layer (rails, pieces, labels, badges, arrows skipped) <key>-<name>-land.png
const { launch, open, ev, mev, PAGE, P2, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const A = [491.96, 239.47], M = [911.91, 588.11], G = [640.42, 676.33];
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, X = (k, c) => `m.setScale(m.maxScale() * ${k}, ${c[0]}, ${c[1]})`, FIT = 'm.ev("fit(); draw()")';
const SESS = {
  main: { views: [['01-start', null], ['02-far', S('m.minScale()', 800, 500)], ['03-mid', S(1.0, 640, 480)], ['04-ref', S(1.142, 700, 560)], ['05-mid-ash', S(1.0, ...A)], ['05b-mid-grey-mere', S(1.0, 780, 640)],
    ['06-near-ash', X(0.55, A)], ['07-near-grey', X(0.6, G)], ['08-near-mere', X(0.6, M)], ['09-max-ash', X(1.0, A)], ['09b-max-ash-west', X(1.0, [330, 230])], ['09c-max-ash-east', X(1.0, [650, 250])],
    ['10-max-grey', X(1.0, G)], ['10b-max-grey-south', X(1.0, [640, 770])], ['11-max-mere', X(1.0, M)], ['12-fit', FIT]] },
  dpr2: { dpr: 2, views: [['20-dpr2-start', null], ['21-dpr2-near-ash', X(0.55, A)], ['22-dpr2-max-ash', X(1.0, A)], ['23-dpr2-max-grey', X(1.0, G)], ['24-dpr2-max-mere', X(1.0, M)]] },
  phone: { w: 390, h: 844, views: [['30-phone-start', null], ['31-phone-fit', FIT], ['32-phone-mid-ash', S(1.0, ...A)], ['33-phone-near-mere', X(0.6, M)], ['34-phone-near-grey', X(0.6, G)]] },
  small: { w: 1280, h: 720, views: [['40-1280-start', null]] },
  big: { w: 1920, h: 1080, views: [['41-1920-start', null], ['42-1920-least', S('m.minScale()', 800, 500)]] },
};
(async () => {
  const key = process.argv[2], file = key === 'p2' ? P2 : PAGE, which = process.argv.slice(3), b = await launch(); const errs = [];
  for (const nm of which) {
    const C = SESS[nm], W = C.w ?? 1440, H = C.h ?? 900, log = { pageErrors: [] };
    const p = await open(b, file, { log, dpr: C.dpr ?? 1, w: W, h: H, settle: 2000 });
    await p.mouse.move(W / 2, H - 4);
    for (const [name, step] of C.views) {
      if (step) await ev(p, step);
      await p.waitForTimeout(2600); await p.screenshot({ path: `${SHOTS}${key}-${name}.png` });
      await mev(p, "for (const k of ['rails','pieces','labels','badges','arrows']) SKIP.add(k); RCK = null; draw();"); await p.waitForTimeout(400);
      await p.screenshot({ path: `${SHOTS}${key}-${name}-land.png` });
      await mev(p, "SKIP.clear(); RCK = null; draw();"); await p.waitForTimeout(300);
      console.log('shot', key, name, await ev(p, 'm.scale().toFixed(3)'));
    }
    errs.push(...log.pageErrors); await p.context().close();
  }
  console.log('pageErrors', errs.length, JSON.stringify(errs.slice(0, 3))); await b.close();
})();
