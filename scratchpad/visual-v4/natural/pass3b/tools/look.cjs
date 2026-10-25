// quick look: node look.cjs <tag> <view,view,...> [dpr] [w h]; shots in ../shots/wip/<tag>-<view>.png (and -land layer copies); page errors printed
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const tag = process.argv[2] || 'wip', want = (process.argv[3] || 'start').split(','), dpr = Number(process.argv[4] || 1), W = Number(process.argv[5] || 1440), H = Number(process.argv[6] || 900);
const WI = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/out/wildinfo.json', 'utf8')); const C = Object.fromEntries(WI.wilds.map((w) => [w.id, w]));
const at = (k, id) => `m.setScale(m.maxScale() * ${k}, ${C[id].cx}, ${C[id].cy})`;
const VIEWS = { start: 'm.ev("fit(); draw()")', far: `m.setScale(60 / m.ev('MED_DIAM'), 800, 500)`, least: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', midAsh: `m.setScale(1.0, ${C.ashspine.cx}, ${C.ashspine.cy})`, midGrey: `m.setScale(1.0, ${(C.greyteeth.cx + C.stillmere.cx) / 2}, ${(C.greyteeth.cy + C.stillmere.cy) / 2})`,
  nearAsh: at(0.55, 'ashspine'), nearGrey: at(0.6, 'greyteeth'), nearMere: at(0.6, 'stillmere'), maxAsh: at(1.0, 'ashspine'), maxGrey: at(1.0, 'greyteeth'), maxMere: at(1.0, 'stillmere'), maxAshW: `m.setScale(m.maxScale(), ${C.ashspine.cx - 140}, ${C.ashspine.cy})`, maxAshE: `m.setScale(m.maxScale(), ${C.ashspine.cx + 150}, ${C.ashspine.cy})` };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const D = SHOTS + 'wip/'; fs.mkdirSync(D, { recursive: true });
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1500, q: process.env.Q || '' }); await p.mouse.move(W / 2, H - 6);
  for (const v of want) { await ev(p, VIEWS[v] || v); await p.waitForTimeout(2200); await p.screenshot({ path: `${D}${tag}-${v}.png` });
    if (process.env.LAND) { await ev(p, "m.skip('rails', true); m.skip('pieces', true); m.skip('labels', true)"); await p.waitForTimeout(900); await p.screenshot({ path: `${D}${tag}-${v}-land.png` }); await ev(p, "m.skip('rails', false); m.skip('pieces', false); m.skip('labels', false)"); }
    console.log('shot', v, await ev(p, '({ Dpx: +(m.scale() * m.ev("MED_DIAM")).toFixed(1), src: m.ev("rlMsSource()"), fk: m.ev("rlMsFineK()") })')); }
  const t = await ev(p, 'm.reliefTimes()'); console.log('bake', t.bakeCpuMs, t.bakeWallMs, JSON.stringify(t.naturalStepsMs), 'msT', JSON.stringify(await mev(p, 'RB.msT')));
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 4))); console.log('console', JSON.stringify(log.console.filter((x) => !/software WebGL|GPU stall/.test(x)).slice(0, 6))); await b.close();
})();
