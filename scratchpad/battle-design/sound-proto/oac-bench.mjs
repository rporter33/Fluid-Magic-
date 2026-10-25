// Renders comparable recipes with OfflineAudioContext in headless Chromium: speed, and
// whether two renders of the same seeded graph are bit-identical.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
const result = await page.evaluate(async () => {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sr = 32000;
  // One graph per variant, as a bank would: swing (noise -> automated band-pass -> gain),
  // clang (8 decaying oscillators), flesh hit (thump osc + noise LP + automated BP).
  async function renderSwing(seed) {
    const r = mulberry32(seed), len = 0.36;
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
    const nb = ctx.createBuffer(1, Math.ceil(sr * len), sr);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    const src = new AudioBufferSourceNode(ctx, { buffer: nb });
    const bp = new BiquadFilterNode(ctx, { type: 'bandpass', Q: 1.2 });
    const curve = new Float32Array(64);
    for (let i = 0; i < 64; i++) { const t = i / 63; curve[i] = 300 + 1200 * Math.sin(Math.PI * t) ** 2; }
    bp.frequency.setValueCurveAtTime(curve, 0, len);
    const g = new GainNode(ctx, { gain: 0 });
    const env = new Float32Array(64);
    for (let i = 0; i < 64; i++) env[i] = Math.sin(Math.PI * (i / 63)) ** 2;
    g.gain.setValueCurveAtTime(env, 0, len);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
    return ctx.startRendering();
  }
  async function renderClang(seed) {
    const r = mulberry32(seed), len = 0.7;
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
    const f0 = 700 + 600 * r();
    for (const [ratio, decay, amp] of [[1, 0.6, 1], [2.756, 0.4, 0.7], [5.404, 0.22, 0.45], [8.933, 0.12, 0.25]]) {
      for (const det of [1, 1.006]) {
        const o = new OscillatorNode(ctx, { frequency: Math.min(15000, f0 * ratio * det) });
        const g = new GainNode(ctx, { gain: amp * 0.2 });
        g.gain.setTargetAtTime(0, 0, decay / 6.91);
        o.connect(g).connect(ctx.destination);
        o.start();
      }
    }
    return ctx.startRendering();
  }
  async function renderFlesh(seed) {
    const r = mulberry32(seed), len = 0.26;
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
    const o = new OscillatorNode(ctx, { frequency: 120 });
    o.frequency.setTargetAtTime(60, 0, 0.03);
    const og = new GainNode(ctx, { gain: 1 });
    og.gain.setTargetAtTime(0, 0.002, 0.09 / 6.91);
    o.connect(og).connect(ctx.destination);
    o.start();
    const nb = ctx.createBuffer(1, Math.ceil(sr * len), sr);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    const src = new AudioBufferSourceNode(ctx, { buffer: nb });
    const lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1100 });
    const bp = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 1500, Q: 3.5 });
    bp.frequency.linearRampToValueAtTime(450, 0.1);
    const ng = new GainNode(ctx, { gain: 0.8 });
    ng.gain.setTargetAtTime(0, 0.001, 0.07 / 6.91);
    src.connect(lp).connect(ng).connect(ctx.destination);
    src.connect(bp).connect(ng);
    src.start();
    return ctx.startRendering();
  }
  const hash = (buf) => {
    const d = buf.getChannelData(0);
    let h = 0x811c9dc5;
    const u = new Uint32Array(d.buffer.slice(0));
    for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
  };
  const out = {};
  for (const [name, fn, n] of [['swing', renderSwing, 40], ['clang', renderClang, 40], ['flesh', renderFlesh, 40]]) {
    await fn(999);
    const t0 = performance.now();
    let audio = 0;
    for (let i = 0; i < n; i++) { const b = await fn(i); audio += b.length / sr; }
    const ms = performance.now() - t0;
    const a = hash(await fn(5)), b = hash(await fn(5));
    out[name] = { audioSec: +audio.toFixed(2), ms: Math.round(ms), xRealtime: Math.round(audio / (ms / 1000)), identicalTwice: a === b };
  }
  // One big context with 120 one-shots laid out in time, as a whole-battle offline mix would be.
  {
    const len = 10;
    const ctx = new OfflineAudioContext(2, sr * len, sr);
    const r = mulberry32(7);
    const nb = ctx.createBuffer(1, sr, sr);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    for (let k = 0; k < 120; k++) {
      const t = (k / 120) * (len - 1);
      const src = new AudioBufferSourceNode(ctx, { buffer: nb });
      const bp = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 400, Q: 1.2 });
      bp.frequency.setValueAtTime(400, t);
      bp.frequency.linearRampToValueAtTime(1600, t + 0.15);
      bp.frequency.linearRampToValueAtTime(400, t + 0.35);
      const g = new GainNode(ctx, { gain: 0 });
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.15);
      g.gain.linearRampToValueAtTime(0, t + 0.35);
      const p = new StereoPannerNode(ctx, { pan: r() * 2 - 1 });
      src.connect(bp).connect(g).connect(p).connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.4);
    }
    const t0 = performance.now();
    await ctx.startRendering();
    const ms = performance.now() - t0;
    out.mix120 = { renderedSec: len, ms: Math.round(ms), xRealtime: Math.round(len / (ms / 1000)) };
  }
  return out;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
