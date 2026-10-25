// Shared bench harness: Pixi app, draw-call counter, GPU sync, frame timing, seeded rng.
import * as PIXI from './pixi.mjs';
export { PIXI };

export const Q = Object.fromEntries(new URLSearchParams(location.search));
export const qn = (k, d) => (Q[k] === undefined ? d : +Q[k]);
export const qs = (k, d) => (Q[k] === undefined ? d : Q[k]);

/** mulberry32: the bench never calls Math.random, so runs repeat exactly. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function makeApp(opts = {}) {
  const app = new PIXI.Application();
  await app.init({
    width: opts.width ?? window.innerWidth,
    height: opts.height ?? window.innerHeight,
    preference: 'webgl',
    antialias: false,
    autoStart: false,
    background: opts.background ?? 0x101010,
    resolution: opts.resolution ?? 1,
    autoDensity: true,
    preserveDrawingBuffer: true,
  });
  app.ticker.stop();
  document.body.appendChild(app.canvas);
  const gl = app.renderer.gl;
  const counter = { draws: 0, instances: 0 };
  for (const name of ['drawElements', 'drawArrays']) {
    const f = gl[name].bind(gl);
    gl[name] = (...a) => { counter.draws++; return f(...a); };
  }
  for (const name of ['drawElementsInstanced', 'drawArraysInstanced']) {
    const f = gl[name].bind(gl);
    gl[name] = (...a) => { counter.draws++; counter.instances += a[a.length - 1]; return f(...a); };
  }
  const px = new Uint8Array(4);
  /** Blocks until the GPU (SwiftShader here) has finished every queued command. */
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return { app, gl, counter, sync };
}

export function stats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const p = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  return { p50: +p(0.5).toFixed(2), p95: +p(0.95).toFixed(2), mean: +mean.toFixed(2), max: +s[s.length - 1].toFixed(2) };
}

/**
 * Runs `frames` frames back to back (no rAF), timing update, Pixi render (CPU: scene walk, batching,
 * buffer upload, GL calls) and the GPU wait (readPixels sync) separately.
 */
export function timeFrames({ app, counter, sync }, update, frames = 240, warm = 40) {
  const up = [], rd = [], gp = [], tot = [];
  let draws = 0;
  for (let f = 0; f < frames + warm; f++) {
    const t0 = performance.now();
    update(f);
    const t1 = performance.now();
    counter.draws = 0;
    app.renderer.render(app.stage);
    const t2 = performance.now();
    sync();
    const t3 = performance.now();
    if (f >= warm) { up.push(t1 - t0); rd.push(t2 - t1); gp.push(t3 - t2); tot.push(t3 - t0); draws = counter.draws; }
  }
  return { update: stats(up), render: stats(rd), gpuWait: stats(gp), total: stats(tot), draws };
}

/** Real rAF loop for `ms`: what frame rate the browser actually delivers (no forced sync). */
export function rafFps({ app }, update, ms = 3000) {
  return new Promise((resolve) => {
    const iv = []; let last = 0, f = 0; const start = performance.now();
    const step = (t) => {
      if (last) iv.push(t - last);
      last = t; update(f++); app.renderer.render(app.stage);
      if (t - start < ms) requestAnimationFrame(step); else resolve({ fps: +(1000 / stats(iv).mean).toFixed(1), interval: stats(iv) });
    };
    requestAnimationFrame(step);
  });
}

export function done(result) {
  window.__result = result;
  const pre = document.createElement('pre');
  pre.id = 'result';
  pre.textContent = JSON.stringify(result, null, 1);
  pre.style.cssText = 'position:fixed;left:0;bottom:0;color:#fff;font:10px monospace;display:none';
  document.body.appendChild(pre);
}

export function memMB() {
  return performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null;
}
