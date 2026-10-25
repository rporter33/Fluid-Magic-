// Times each representative recipe's bake, checks determinism, and writes WAVs to audition.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { RECIPES, type Baked } from './recipes';
import { hash32, stats } from './dsp';

const outDir = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/battle-design/judge1/bench/wav/';
mkdirSync(outDir, { recursive: true });

function wav(b: Baked): Buffer {
  const ch = b.channels.length, n = b.channels[0]!.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * ch * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(b.sr, 24); buf.writeUInt32LE(b.sr * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32);
  buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * ch * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, b.channels[c]![i]!));
    buf.writeInt16LE(Math.round(v * 32767), 44 + (i * ch + c) * 2);
  }
  return buf;
}

const digest = (b: Baked) => {
  const h = createHash('sha1');
  for (const c of b.channels) h.update(Buffer.from(c.buffer));
  return h.digest('hex').slice(0, 12);
};

let totalAudio = 0, totalMs = 0, totalBytes = 0;
const rows: Record<string, unknown>[] = [];
for (const [id, { fn, variants }] of Object.entries(RECIPES)) {
  // Warm up the JIT once so the timing reflects steady state, as a long bake would.
  fn(hash32(id, 'warm'));
  let audio = 0, bytes = 0;
  const t0 = performance.now();
  const baked: Baked[] = [];
  for (let v = 0; v < variants; v++) {
    const b = fn(hash32(id, v, 1));
    baked.push(b);
    audio += b.channels[0]!.length / b.sr * b.channels.length;
    bytes += b.channels.reduce((s, c) => s + c.byteLength, 0);
  }
  const ms = performance.now() - t0;
  const again = fn(hash32(id, 0, 1));
  const st = stats(baked[0]!.channels[0]!, baked[0]!.sr);
  writeFileSync(`${outDir}${id}.wav`, wav(baked[0]!));
  writeFileSync(`${outDir}${id}.v2.wav`, wav(baked[Math.min(1, baked.length - 1)]!));
  rows.push({
    id, variants, audioSec: +audio.toFixed(2), bakeMs: +ms.toFixed(1),
    xRealtime: Math.round(audio / (ms / 1000)), KB: Math.round(bytes / 1024),
    deterministic: digest(again) === digest(baked[0]!), distinct: digest(baked[0]!) !== digest(baked[1] ?? baked[0]!),
    peakDb: +st.peakDb.toFixed(1), rmsDb: +st.rmsDb.toFixed(1), nan: st.nan,
  });
  totalAudio += audio; totalMs += ms; totalBytes += bytes;
}
console.table(rows);
console.log({ totalAudioSec: +totalAudio.toFixed(1), totalBakeMs: Math.round(totalMs), xRealtime: Math.round(totalAudio / (totalMs / 1000)), MB: +(totalBytes / 1048576).toFixed(2) });
