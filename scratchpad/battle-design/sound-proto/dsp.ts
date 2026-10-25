// Prototype of the pure synthesis core proposed in proposal-sound.md: no Web Audio, no
// Math.random, every random draw from a seeded stream. Renders Float32Arrays.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash32(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  const s = parts.join('\u0001');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const TABLE = 4096;
const SINE = new Float32Array(TABLE + 1);
for (let i = 0; i <= TABLE; i++) SINE[i] = Math.sin((2 * Math.PI * i) / TABLE);
/** Sine of a phase in cycles, by table lookup with linear interpolation. */
export function fsin(cycles: number): number {
  const x = (cycles - Math.floor(cycles)) * TABLE;
  const i = x | 0;
  return SINE[i]! + (SINE[i + 1]! - SINE[i]!) * (x - i);
}
/** Rational tanh approximation, exact enough for drive. */
export function ftanh(x: number): number {
  if (x > 3) return 1;
  if (x < -3) return -1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (r: Rng, lo: number, hi: number) => lo + (hi - lo) * r();
export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Piecewise-linear curve over normalized or absolute time: [[t, v], ...]. */
export function curve(points: [number, number][], t: number): number {
  if (t <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [t1, v1] = points[i]!;
    if (t <= t1) {
      const [t0, v0] = points[i - 1]!;
      return lerp(v0, v1, (t - t0) / (t1 - t0 || 1));
    }
  }
  return points[points.length - 1]![1];
}

/** Attack then exponential decay to -60 dB over `decay` seconds. */
export function adEnv(t: number, attack: number, decay: number): number {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  return Math.exp((-6.91 * (t - attack)) / decay);
}

/** A smooth bell: rises over `peak` then falls to zero at `len`. */
export function bell(t: number, peak: number, len: number): number {
  if (t <= 0 || t >= len) return 0;
  if (t < peak) return Math.sin((Math.PI / 2) * (t / peak)) ** 2;
  return Math.cos((Math.PI / 2) * ((t - peak) / (len - peak))) ** 2;
}

export class Noise {
  private b0 = 0;
  private b1 = 0;
  private b2 = 0;
  private brown = 0;
  constructor(private rng: Rng) {}
  white(): number {
    return this.rng() * 2 - 1;
  }
  /** Paul Kellet's economy pink filter. */
  pink(): number {
    const w = this.white();
    this.b0 = 0.99765 * this.b0 + w * 0.099046;
    this.b1 = 0.963 * this.b1 + w * 0.2965164;
    this.b2 = 0.57 * this.b2 + w * 1.0526913;
    return (this.b0 + this.b1 + this.b2 + w * 0.1848) * 0.2;
  }
  brownN(): number {
    this.brown = (this.brown + 0.02 * this.white()) / 1.02;
    return this.brown * 3.5;
  }
}

export type FilterType = 'lp' | 'hp' | 'bp' | 'peak';

/** RBJ cookbook biquad, transposed direct form II. */
export class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private z1 = 0;
  private z2 = 0;
  constructor(private sr: number) {}
  set(type: FilterType, f: number, q: number, gainDb = 0): this {
    const w = (2 * Math.PI * Math.min(f, this.sr * 0.49)) / this.sr;
    const cw = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
    if (type === 'lp') {
      b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2;
      a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    } else if (type === 'hp') {
      b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2;
      a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    } else if (type === 'bp') {
      b0 = alpha; b1 = 0; b2 = -alpha;
      a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    } else {
      const A = Math.pow(10, gainDb / 40);
      b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A;
      a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  run(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

/** Decaying sine partials: the modal model for metal, wood, stone, bells. */
export function modal(
  out: Float32Array,
  sr: number,
  start: number,
  f0: number,
  ratios: readonly number[],
  decays: readonly number[],
  amps: readonly number[],
  gain: number,
  rng: Rng,
  detune = 0,
): void {
  const s0 = Math.floor(start * sr);
  for (let p = 0; p < ratios.length; p++) {
    const f = f0 * ratios[p]! * (1 + (rng() * 2 - 1) * detune);
    if (f >= sr * 0.45) continue;
    const k = Math.exp(-6.91 / (decays[p]! * sr));
    // Recursive sine oscillator: cheap and exact.
    const w = (2 * Math.PI * f) / sr;
    const c = 2 * Math.cos(w);
    let y1 = Math.sin(rng() * 6.283);
    let y2 = Math.sin(Math.asin(y1) - w);
    let a = amps[p]! * gain;
    const n = Math.min(out.length - s0, Math.ceil(decays[p]! * sr));
    for (let i = 0; i < n; i++) {
      const y = c * y1 - y2;
      y2 = y1;
      y1 = y;
      out[s0 + i]! += y * a;
      a *= k;
    }
  }
}

/** Karplus-Strong pluck with a one-pole damping filter. */
export function pluck(out: Float32Array, sr: number, f0: number, decay: number, bright: number, gain: number, rng: Rng): void {
  const len = Math.max(2, Math.round(sr / f0));
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) buf[i] = rng() * 2 - 1;
  const fb = Math.exp(-6.91 / (decay * f0));
  let idx = 0;
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    const x = buf[idx]!;
    const y = (bright * x + (1 - bright) * prev) * fb;
    prev = x;
    buf[idx] = y;
    idx = (idx + 1) % len;
    out[i]! += x * gain;
  }
}

/** Grains: short filtered noise impulses at Poisson times (crackle, debris, rattles, rain). */
export function grains(
  out: Float32Array,
  sr: number,
  rng: Rng,
  opts: {
    start: number;
    end: number;
    rate: (t: number) => number; // grains per second at time t
    dur: [number, number];
    freq: [number, number];
    q: number;
    amp: (t: number) => number;
    powerLaw?: number; // amplitude distribution exponent (crackle: many small, few big)
  },
): void {
  const f = new Biquad(sr);
  const noise = new Noise(rng);
  let t = opts.start;
  while (t < opts.end) {
    const r = Math.max(1e-3, opts.rate(t));
    t += -Math.log(1 - rng()) / r;
    if (t >= opts.end) break;
    const d = range(rng, opts.dur[0], opts.dur[1]);
    const fc = Math.exp(range(rng, Math.log(opts.freq[0]), Math.log(opts.freq[1])));
    f.set('bp', fc, opts.q);
    const a = opts.amp(t) * Math.pow(rng(), opts.powerLaw ?? 1);
    const s0 = Math.floor(t * sr);
    const n = Math.min(out.length - s0, Math.ceil(d * sr * 3));
    for (let i = 0; i < n; i++) {
      const e = Math.exp((-6.91 * i) / (d * sr));
      out[s0 + i]! += f.run(noise.white() * e) * a;
    }
  }
}

/** Vowel formant table (adult male, Peterson and Barney style), Hz. */
export const VOWELS = {
  a: [730, 1090, 2440, 3400, 4300],
  o: [570, 840, 2410, 3300, 4200],
  u: [300, 870, 2240, 3300, 4200],
  uh: [640, 1190, 2390, 3400, 4300],
  ae: [660, 1720, 2410, 3400, 4300],
  e: [530, 1840, 2480, 3500, 4400],
  i: [270, 2290, 3010, 3600, 4500],
  m: [250, 1200, 2300, 3300, 4200],
} as const;
export type Vowel = keyof typeof VOWELS;
const FORMANT_BW = [80, 100, 140, 200, 260];
const FORMANT_AMP = [1, 0.6, 0.35, 0.18, 0.1];

/**
 * Source-filter voice: a jittered, shimmering glottal pulse train plus breath noise through
 * five parallel formant resonators that glide between vowels, then roughness and drive.
 */
export function voice(
  out: Float32Array,
  sr: number,
  rng: Rng,
  p: {
    start: number;
    len: number;
    f0: [number, number][]; // Hz over normalized time
    vowels: [number, Vowel][]; // vowel targets over normalized time
    amp: [number, number][]; // envelope over normalized time
    breath: [number, number][]; // aspiration share over normalized time
    tract: number; // vocal tract length factor (formants divided by it)
    jitter: number;
    shimmer: number;
    vibrato: { rate: number; depth: number };
    roughness: { rate: number; depth: number }; // amplitude modulation 30-150 Hz (screams)
    drive: number;
    gain: number;
  },
): void {
  const n = Math.min(out.length - Math.floor(p.start * sr), Math.floor(p.len * sr));
  const s0 = Math.floor(p.start * sr);
  const noise = new Noise(rng);
  const filters = FORMANT_BW.map(() => new Biquad(sr));
  const tilt = new Biquad(sr).set('lp', 2400, 0.6);
  let phase = 0;
  let periodJit = 1;
  let periodShim = 1;
  const block = 32;
  // Control-rate values, refreshed every block (k-rate), as the engine spec requires.
  let kf0 = 0, kBreath = 0, kAmp = 0, kAmpNext = 0;
  const vibInc = p.vibrato.rate / sr, roughInc = p.roughness.rate / sr;
  let vibPh = 0, roughPh = 0;
  for (let i = 0; i < n; i++) {
    if (i % block === 0) {
      const tn = i / n;
      const v = p.vowels;
      let a: Vowel = v[0]![1];
      let b: Vowel = a;
      let w = 0;
      for (let k = 1; k < v.length; k++) {
        if (tn <= v[k]![0]) {
          a = v[k - 1]![1];
          b = v[k]![1];
          w = (tn - v[k - 1]![0]) / (v[k]![0] - v[k - 1]![0] || 1);
          break;
        }
        a = b = v[k]![1];
        w = 0;
      }
      if (i % (block * 2) === 0) {
        for (let k = 0; k < filters.length; k++) {
          const f = lerp(VOWELS[a][k]!, VOWELS[b][k]!, w) / p.tract;
          filters[k]!.set('bp', f, f / FORMANT_BW[k]!);
        }
      }
      kf0 = curve(p.f0, tn);
      kBreath = curve(p.breath, tn);
      kAmp = curve(p.amp, tn);
      kAmpNext = curve(p.amp, Math.min(1, (i + block) / n));
    }
    const amp = kAmp + (kAmpNext - kAmp) * ((i % block) / block);
    vibPh += vibInc;
    roughPh += roughInc;
    const f0 = kf0 * (1 + p.vibrato.depth * fsin(vibPh)) * periodJit;
    phase += f0 / sr;
    if (phase >= 1) {
      phase -= 1;
      periodJit = 1 + (rng() * 2 - 1) * p.jitter;
      periodShim = 1 + (rng() * 2 - 1) * p.shimmer;
    }
    const g = (phase < 0.6 ? fsin(phase / 1.2) : 0) * periodShim;
    const src = tilt.run(g - 0.38) * (1 - kBreath) + noise.white() * 0.35 * kBreath;
    let y = 0;
    for (let k = 0; k < filters.length; k++) y += filters[k]!.run(src) * FORMANT_AMP[k]!;
    const rough = 1 - p.roughness.depth * (0.5 + 0.5 * fsin(roughPh));
    out[s0 + i]! += ftanh(y * amp * rough * p.drive) * p.gain;
  }
}

/** Band-limited sawtooth (polyBLEP). */
export class Saw {
  private ph = 0;
  constructor(private sr: number) {}
  next(f: number): number {
    const dt = f / this.sr;
    this.ph += dt;
    if (this.ph >= 1) this.ph -= 1;
    let y = 2 * this.ph - 1;
    const t = this.ph;
    if (t < dt) {
      const x = t / dt;
      y -= x + x - x * x - 1;
    } else if (t > 1 - dt) {
      const x = (t - 1) / dt;
      y -= x * x + x + x + 1;
    }
    return y;
  }
}

export function normalizePeak(buf: Float32Array, peakDb = -1): void {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]!));
  if (peak === 0) return;
  const g = dbToGain(peakDb) / peak;
  for (let i = 0; i < buf.length; i++) buf[i]! *= g;
}

export function stats(buf: Float32Array, sr: number) {
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i]!;
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  return {
    peakDb: 20 * Math.log10(peak || 1e-9),
    rmsDb: 10 * Math.log10(sum / buf.length || 1e-18),
    seconds: buf.length / sr,
    nan: buf.some((v) => Number.isNaN(v)),
  };
}
