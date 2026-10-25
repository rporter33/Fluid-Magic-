// Uncapped and capped voice demand in the busiest phase (first contact of the 300-vs-300
// fixture): the strike plan of the spectacle proposal (90 strikes and about 60 visible deaths in
// a 4.0 s window at 1x; 30 strikes in 1.0 s of real time at 4x), the cue-to-sound rules of this
// proposal, and the class caps. Reports peak concurrency per class and what the caps drop.
import { mulberry32 } from './dsp';

type Cls = 'swing' | 'impact' | 'gore' | 'voice' | 'body';
interface Inst { t: number; dur: number; cls: Cls; prio: number }
const CAPS: Record<Cls, number> = { swing: 8, impact: 20, gore: 6, voice: 10, body: 8 };
const KEEP: Record<string, Record<number, number>> = {
  swing: { 1: 0.35, 4: 0 }, grunt: { 1: 0.4, 4: 0 }, wound: { 1: 1, 4: 0.4 }, cry: { 1: 1, 4: 0.4 }, fall: { 1: 1, 4: 0.4 }, gore: { 1: 1, 4: 0.3 }, drop: { 1: 0.3, 4: 0 },
};

function plan(speed: 1 | 4, seed: number): Inst[] {
  const r = mulberry32(seed);
  const strikes = speed === 1 ? 90 : 30;
  const deaths = speed === 1 ? 60 : 40;
  const window = 4.0 / speed; // real seconds
  const out: Inst[] = [];
  const at = () => {
    // Crescendo: density rises over the first third, then steady, then eases.
    const u = r();
    return window * (u < 0.2 ? Math.sqrt(u / 0.2) * 0.33 : 0.33 + (u - 0.2) / 0.8 * 0.67);
  };
  const keep = (k: string) => r() < (KEEP[k]![speed] ?? 1);
  for (let i = 0; i < strikes; i++) {
    const t = at();
    const kill = i < deaths * (strikes / 90) * 0.6;
    if (keep('swing')) out.push({ t: t - 0.15, dur: 0.25, cls: 'swing', prio: 20 });
    out.push({ t, dur: 0.22, cls: 'impact', prio: kill ? 60 : 40 });
    if (r() < 0.5) out.push({ t, dur: 0.3, cls: 'impact', prio: 35 }); // armor or shield layer
    if (!kill && keep('wound')) {
      if (keep('gore')) out.push({ t, dur: 0.2, cls: 'gore', prio: 30 });
      if (keep('grunt')) out.push({ t: t + 0.03, dur: 0.28, cls: 'voice', prio: 25 });
    }
  }
  for (let i = 0; i < deaths; i++) {
    const t = at();
    out.push({ t, dur: 0.22, cls: 'impact', prio: 60 });
    out.push({ t, dur: 0.2, cls: 'impact', prio: 55 }); // crunch
    if (keep('gore')) out.push({ t, dur: 0.4, cls: 'gore', prio: 45 });
    if (keep('cry')) out.push({ t: t + 0.05, dur: speed === 4 ? 0.45 : 0.95, cls: 'voice', prio: 50 });
    if (keep('fall')) out.push({ t: t + 0.35, dur: 0.35, cls: 'body', prio: 30 });
    if (keep('drop')) out.push({ t: t + 0.3, dur: 0.5, cls: 'body', prio: 20 });
  }
  return out.sort((a, b) => a.t - b.t);
}

function simulate(list: Inst[], capped: boolean) {
  const active: Record<Cls, Inst[]> = { swing: [], impact: [], gore: [], voice: [], body: [] };
  const peak: Record<Cls, number> = { swing: 0, impact: 0, gore: 0, voice: 0, body: 0 };
  let dropped = 0, stolen = 0, droppedHigh = 0;
  for (const x of list) {
    const a = active[x.cls];
    for (let i = a.length - 1; i >= 0; i--) if (a[i]!.t + a[i]!.dur <= x.t) a.splice(i, 1);
    if (capped && a.length >= CAPS[x.cls]) {
      // Steal the weakest active voice if the newcomer beats it by 5, else drop the newcomer.
      const score = (v: Inst) => v.prio - 20 * Math.min(1, (x.t - v.t) / v.dur);
      let wi = 0;
      for (let i = 1; i < a.length; i++) if (score(a[i]!) < score(a[wi]!)) wi = i;
      if (x.prio > score(a[wi]!) + 5) { a.splice(wi, 1); stolen++; } else { dropped++; if (x.prio >= 50) droppedHigh++; continue; }
    }
    a.push(x);
    peak[x.cls] = Math.max(peak[x.cls], a.length);
  }
  return { instances: list.length, peak, dropped, stolen, droppedHighPrio: droppedHigh };
}

for (const speed of [1, 4] as const) {
  const p = plan(speed, 42);
  const real = p.length > 0 ? 4.0 / speed : 1;
  console.log(`speed ${speed}x: ${p.length} instances in ${real} s real (${Math.round(p.length / real)}/s)`);
  console.log('  uncapped', JSON.stringify(simulate(p, false)));
  console.log('  capped  ', JSON.stringify(simulate(p, true)));
}
