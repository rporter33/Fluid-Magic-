import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const out = await page.evaluate(async () => {
  const sr = 32000;
  async function clang(variant) {
    const ctx = new OfflineAudioContext(1, sr * 0.7, sr);
    for (const [ratio, decay] of [[1, 0.6], [2.756, 0.4], [5.404, 0.22], [8.933, 0.12]]) {
      const o = new OscillatorNode(ctx, { frequency: 1000 * ratio });
      const g = new GainNode(ctx, { gain: 0.2 });
      if (variant === 'setTarget') g.gain.setTargetAtTime(0, 0, decay / 6.91);
      if (variant === 'expRamp') g.gain.exponentialRampToValueAtTime(0.0001, decay);
      o.connect(g).connect(ctx.destination);
      o.start();
    }
    const b = await ctx.startRendering();
    const u = new Uint32Array(b.getChannelData(0).buffer.slice(0));
    let h = 0x811c9dc5; for (const x of u) { h ^= x; h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
  }
  const res = {};
  for (const v of ['none', 'setTarget', 'expRamp']) {
    const hs = [];
    for (let i = 0; i < 6; i++) hs.push(await clang(v));
    res[v] = new Set(hs).size + ' distinct of 6';
  }
  return res;
});
console.log(out);
await browser.close();
