// Representative recipes, one per family, written the way the proposal specifies them, to
// measure bake cost. Each takes (sr, seed) and returns mono or stereo Float32Arrays.
import {
  adEnv, bell, Biquad, curve, grains, modal, mulberry32, Noise, normalizePeak, pluck, range,
  Saw, voice, type Vowel,
} from './dsp';

export interface Baked { sr: number; channels: Float32Array[] }
type Recipe = (seed: number) => Baked;

const mono = (sr: number, len: number) => new Float32Array(Math.ceil(sr * len));

/** swing.heavy: pink noise through a band-pass riding a velocity bell, plus a low swell. */
export const swingHeavy: Recipe = (seed) => {
  const sr = 32000, len = range(mulberry32(seed), 0.32, 0.4);
  const r = mulberry32(seed + 1), out = mono(sr, len), n = new Noise(r), f = new Biquad(sr);
  const lo = range(r, 250, 320), hi = range(r, 1100, 1500), peak = range(r, 0.45, 0.6) * len;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr, v = bell(t, peak, len);
    if (i % 16 === 0) f.set('bp', lo + (hi - lo) * v, 1.2);
    out[i] = f.run(n.pink()) * v * 3 + Math.sin(2 * Math.PI * 80 * t) * v * 0.15;
  }
  normalizePeak(out);
  return { sr, channels: [out] };
};

/** parry.blade: inharmonic free-bar partials, detuned pairs, a click, and a scrape. */
export const parryBlade: Recipe = (seed) => {
  const sr = 48000, r = mulberry32(seed), out = mono(sr, 0.7), n = new Noise(r);
  const f0 = range(r, 700, 1300);
  const ratios = [1, 2.756, 5.404, 8.933], decays = [0.6, 0.4, 0.22, 0.12], amps = [1, 0.7, 0.45, 0.25];
  modal(out, sr, 0, f0, ratios, decays.map((d) => d * range(r, 0.8, 1.2)), amps, 0.25, r, 0.004);
  modal(out, sr, 0, f0 * 1.006, ratios, decays, amps, 0.18, r, 0.004);
  const hp = new Biquad(sr).set('hp', 4000, 0.7);
  for (let i = 0; i < 0.004 * sr; i++) out[i]! += hp.run(n.white()) * (1 - i / (0.004 * sr));
  const bp = new Biquad(sr).set('bp', range(r, 3000, 4500), 4);
  const scrape = range(r, 0.06, 0.15);
  for (let i = 0; i < scrape * sr; i++) {
    const jit = 0.5 + 0.5 * Math.sin(i * 0.013 + r() * 0.5);
    out[i]! += bp.run(n.white()) * jit * 0.4 * (1 - i / (scrape * sr));
  }
  normalizePeak(out);
  return { sr, channels: [out] };
};

/** hit.flesh.chop: pitch-dropping thump, low smack, wet squelch sweep, bone crunch grains. */
export const hitFleshChop: Recipe = (seed) => {
  const sr = 32000, r = mulberry32(seed), out = mono(sr, 0.26), n = new Noise(r);
  const f0 = range(r, 100, 140);
  let ph = 0;
  const lp = new Biquad(sr).set('lp', range(r, 900, 1400), 0.7);
  const sq = new Biquad(sr);
  const sqLen = range(r, 0.07, 0.12), sqHi = range(r, 1300, 1700), sqLo = range(r, 350, 550);
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    ph += (f0 * (0.5 + 0.5 * Math.exp(-t / 0.03))) / sr;
    let y = Math.sin(2 * Math.PI * ph) * adEnv(t, 0.002, 0.09);
    y += lp.run(n.brownN()) * adEnv(t, 0.001, 0.07) * 0.8;
    if (t < sqLen) {
      if (i % 16 === 0) sq.set('bp', sqHi + (sqLo - sqHi) * (t / sqLen), 3.5);
      y += sq.run(n.white()) * (1 - t / sqLen) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 45 * t)) * 0.7;
    }
    out[i] = y;
  }
  grains(out, sr, r, {
    start: 0.005, end: 0.08, rate: () => 160, dur: [0.001, 0.004], freq: [1500, 3800], q: 2,
    amp: (t) => 0.9 * Math.exp(-t / 0.04), powerLaw: 1.5,
  });
  normalizePeak(out);
  return { sr, channels: [out] };
};

const SCREAM_VOWELS: [number, Vowel][][] = [
  [[0, 'ae'], [0.25, 'a'], [1, 'o']],
  [[0, 'a'], [0.5, 'a'], [1, 'uh']],
  [[0, 'e'], [0.3, 'a'], [1, 'o']],
];

/** voice.death.scream: source-filter voice, f0 rises then falls, roughness, breath tail. */
export const deathScream: Recipe = (seed) => {
  const sr = 32000, r = mulberry32(seed), len = range(r, 0.7, 1.1), out = mono(sr, len + 0.05);
  const f = range(r, 150, 260);
  voice(out, sr, r, {
    start: 0, len,
    f0: [[0, f], [0.15, f * 1.35], [0.6, f * 0.9], [1, f * 0.55]],
    vowels: SCREAM_VOWELS[Math.floor(r() * 3)]!,
    amp: [[0, 0], [0.04, 1], [0.5, 0.8], [1, 0]],
    breath: [[0, 0.1], [0.6, 0.15], [1, 0.6]],
    tract: range(r, 0.9, 1.1), jitter: 0.02, shimmer: 0.08,
    vibrato: { rate: range(r, 5, 7), depth: 0.025 },
    roughness: { rate: range(r, 40, 80), depth: range(r, 0.2, 0.5) },
    drive: range(r, 2, 4), gain: 0.8,
  });
  normalizePeak(out);
  return { sr, channels: [out] };
};

/** bow.long: Karplus-Strong string thrum, a bracer slap, a limb whoosh. */
export const bowLong: Recipe = (seed) => {
  const sr = 32000, r = mulberry32(seed), out = mono(sr, 0.45), n = new Noise(r);
  pluck(out, sr, range(r, 70, 110), 0.12, 0.6, 0.8, r);
  const bp = new Biquad(sr).set('bp', 2500, 3);
  for (let i = 0; i < 0.005 * sr; i++) out[i]! += bp.run(n.white()) * 0.8;
  const w = new Biquad(sr).set('bp', 500, 1.5);
  for (let i = 0; i < 0.06 * sr; i++) out[i]! += w.run(n.white()) * bell(i / sr, 0.015, 0.06) * 0.5;
  normalizePeak(out);
  return { sr, channels: [out] };
};

/** arrow.flyby: narrow band-passed noise, center falling 12% (Doppler), bell envelope. */
export const arrowFlyby: Recipe = (seed) => {
  const sr = 48000, r = mulberry32(seed), len = range(r, 0.55, 0.8), out = mono(sr, len), n = new Noise(r);
  const f = new Biquad(sr), fc = range(r, 2600, 4200), pass = range(r, 0.4, 0.6) * len;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    if (i % 32 === 0) f.set('bp', fc * (1.06 - 0.12 / (1 + Math.exp(-(t - pass) * 30))), 11);
    out[i] = f.run(n.white()) * bell(t, pass, len) * 4;
  }
  normalizePeak(out);
  return { sr, channels: [out] };
};

/** explosion.fire (stereo): noise burst with a falling low-pass, a sub drop, crackle tail. */
export const explosionFire: Recipe = (seed) => {
  const sr = 32000, r = mulberry32(seed), len = 2.0;
  const chans = [mono(sr, len), mono(sr, len)];
  const sub = range(r, 45, 55);
  chans.forEach((out, ch) => {
    const rc = mulberry32(seed * 7 + ch), n = new Noise(rc), lp = new Biquad(sr);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / sr;
      if (i % 16 === 0) lp.set('lp', 180 + 3800 * Math.exp(-t / 0.25), 0.8);
      ph += (sub * (0.6 + 0.4 * Math.exp(-t / 0.3))) / sr;
      out[i] = lp.run(n.white()) * adEnv(t, 0.002, 1.2) + Math.sin(2 * Math.PI * ph) * adEnv(t, 0.005, 0.6) * 0.6;
    }
    grains(out, sr, rc, {
      start: 0.05, end: len, rate: (t) => 220 * Math.exp(-t / 0.7), dur: [0.0005, 0.003],
      freq: [1200, 6000], q: 1.5, amp: (t) => 0.5 * Math.exp(-t / 0.8), powerLaw: 2,
    });
    normalizePeak(out, -1);
  });
  return { sr, channels: chans };
};

/** horn.retreat: brassy saw stack, brightness follows amplitude, scoop and vibrato, two falling notes. */
export const hornRetreat: Recipe = (seed) => {
  const sr = 32000, r = mulberry32(seed), out = mono(sr, 2.2);
  const s1 = new Saw(sr), s2 = new Saw(sr), lp = new Biquad(sr);
  const notes: [number, number, number][] = [[0, 1.0, 110], [1.0, 2.15, 82.4]];
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const note = t < 1.0 ? notes[0]! : notes[1]!;
    const nt = t - note[0], nl = note[1] - note[0];
    const env = Math.min(1, nt / 0.12) * Math.min(1, (nl - nt) / 0.25);
    const scoop = 1 - 0.03 * Math.exp(-nt / 0.06);
    const vib = 1 + 0.006 * Math.sin(2 * Math.PI * 5 * t) + 0.009 * Math.sin(2 * Math.PI * 0.5 * t + r() * 0.01);
    const f = note[2] * scoop * vib;
    if (i % 32 === 0) lp.set('lp', 300 + 1600 * env, 1.1);
    out[i] = lp.run(s1.next(f) * 0.7 + s2.next(f * 2.003) * 0.3) * Math.max(0, env);
  }
  normalizePeak(out);
  return { sr, channels: [out] };
};

/** fire.crackle loop (stereo): Farnell's hiss, crackle, and lapping layers. */
export const fireCrackle: Recipe = (seed) => {
  const sr = 32000, len = 4;
  const chans = [mono(sr, len), mono(sr, len)];
  chans.forEach((out, ch) => {
    const r = mulberry32(seed * 13 + ch), n = new Noise(r);
    const hp = new Biquad(sr).set('hp', 2500, 0.7), lap = new Biquad(sr).set('lp', 400, 0.7);
    let am = 0.5;
    for (let i = 0; i < out.length; i++) {
      if (i % 256 === 0) am = Math.min(1, Math.max(0.1, am + (r() - 0.5) * 0.2));
      out[i] = hp.run(n.white()) * 0.08 + lap.run(n.brownN()) * am * 0.9;
    }
    grains(out, sr, r, {
      start: 0, end: len, rate: () => 70, dur: [0.0003, 0.002], freq: [800, 7000], q: 1.2,
      amp: () => 1.4, powerLaw: 2.5,
    });
    normalizePeak(out, -3);
  });
  return { sr, channels: chans };
};

/** chant.warcry (stereo): 12 formant voices shouting three barks with shield bangs. */
export const chantWarcry: Recipe = (seed) => {
  const sr = 32000, len = 2.4, chans = [mono(sr, len), mono(sr, len)];
  const r0 = mulberry32(seed);
  for (let v = 0; v < 12; v++) {
    const r = mulberry32(seed * 31 + v), ch = chans[v % 2]!;
    const f = range(r, 90, 150);
    for (let bark = 0; bark < 3; bark++) {
      const start = bark * 0.7 + range(r, 0, 0.06);
      voice(ch, sr, r, {
        start, len: range(r, 0.35, 0.5),
        f0: [[0, f], [0.2, f * 1.25], [1, f * 0.8]],
        vowels: [[0, 'ae'], [0.3, 'a'], [1, 'uh']],
        amp: [[0, 0], [0.08, 1], [0.6, 0.8], [1, 0]],
        breath: [[0, 0.15], [1, 0.4]],
        tract: range(r, 0.88, 1.12), jitter: 0.03, shimmer: 0.1,
        vibrato: { rate: 5, depth: 0.01 }, roughness: { rate: 60, depth: 0.25 },
        drive: 3, gain: 0.25,
      });
    }
  }
  for (let bark = 0; bark < 3; bark++) {
    for (const ch of chans) modal(ch, sr, bark * 0.7 + 0.42, range(r0, 160, 220), [1, 2.3, 3.6], [0.12, 0.08, 0.05], [1, 0.5, 0.3], 0.6, r0, 0.02);
  }
  chans.forEach((c) => normalizePeak(c, -1));
  return { sr, channels: chans };
};

export const RECIPES: Record<string, { fn: Recipe; variants: number }> = {
  'swing.heavy': { fn: swingHeavy, variants: 6 },
  'parry.blade': { fn: parryBlade, variants: 10 },
  'hit.flesh.chop': { fn: hitFleshChop, variants: 10 },
  'voice.death.scream': { fn: deathScream, variants: 12 },
  'bow.long': { fn: bowLong, variants: 6 },
  'arrow.flyby': { fn: arrowFlyby, variants: 8 },
  'explosion.fire': { fn: explosionFire, variants: 4 },
  'horn.retreat': { fn: hornRetreat, variants: 2 },
  'fire.crackle': { fn: fireCrackle, variants: 2 },
  'chant.warcry': { fn: chantWarcry, variants: 2 },
};

export { curve, pluck };
