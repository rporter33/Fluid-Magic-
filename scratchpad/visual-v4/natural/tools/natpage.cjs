// Open the v4 mockup and, in memory only, swap its land bake for the natural prototype's (proto/data/natural*.rgba and Lab mips),
// with the natural water colour. The page file is never changed. Optional patches (hairline / keyline per segment) are page-side code strings.
const { launch, open } = require('../../map/tools/lib.cjs');
const fs = require('fs');
const PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html';
const DATA = __dirname + '/../proto/data/';
async function sendRGBA(page, name, file, w, h) {
  const b64 = fs.readFileSync(file).toString('base64');
  const CH = 4 << 20; await page.evaluate(() => { window.__nat = window.__nat || {}; window.__natBuf = []; });
  for (let i = 0; i < b64.length; i += CH) await page.evaluate((s) => window.__natBuf.push(s), b64.slice(i, i + CH));
  await page.evaluate(([name, w, h]) => { const s = atob(window.__natBuf.join('')); const u = new Uint8ClampedArray(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); window.__nat[name] = new ImageData(u, w, h); window.__natBuf = []; }, [name, w, h]);
}
async function injectNatural(page, tag = '', water = '#14615B') {
  const [BW, BH] = [2048, 1280];
  await sendRGBA(page, 'img', DATA + `natural${tag}.rgba`, BW, BH);
  await sendRGBA(page, 'mb1', DATA + `natural${tag}-m1.rgba`, BW / 2, BH / 2);
  await sendRGBA(page, 'mb2', DATA + `natural${tag}-m2.rgba`, BW / 4, BH / 4);
  return page.evaluate((water) => window.__mock.ev(`(() => {
    const N2 = window.__nat; window.__natSaved = window.__natSaved || { img: RB.img, mb1: RB.mb1, mb2: RB.mb2, canvas: RB.canvas, mip1: RB.mip1, mip2: RB.mip2, water: RL_C.water };
    const mk = (d) => { const c = makeCanvas(d.width, d.height); c.getContext('2d').putImageData(d, 0, 0); return c; };
    RB.img = N2.img; RB.mb1 = N2.mb1; RB.mb2 = N2.mb2; RB.canvas = mk(N2.img); RB.mip1 = mk(N2.mb1); RB.mip2 = mk(N2.mb2);
    RL_C.water = '${water}'; RLW.keys = null; rlAfterBake(); RCK = null; draw(); return 'natural';
  })()`), water);
}
async function restoreClear(page) {
  return page.evaluate(() => window.__mock.ev(`(() => { const S = window.__natSaved; if (!S) return 'clear'; Object.assign(RB, { img: S.img, mb1: S.mb1, mb2: S.mb2, canvas: S.canvas, mip1: S.mip1, mip2: S.mip2 }); RL_C.water = S.water; RLW.keys = null; rlAfterBake(); RCK = null; draw(); return 'clear'; })()`));
}
async function evalIn(page, src) { return page.evaluate((s) => window.__mock.ev(s), src); }
async function view(page, src, wait = 900) { if (src) await page.evaluate((s) => { const m = window.__mock; eval(s); }, src); await page.waitForTimeout(wait); }
module.exports = { launch, open, PAGE, injectNatural, restoreClear, evalIn, view, sendRGBA };
