// Data modes against the painted fills: MODE_BASE frozen at the approved values, or lifted toward the cloth by k.
import { BRIGHT, TERRAINS, type T, type Pal, dN, dCvd, over, desat, f1, wcag, mLab } from './lib';
const P = JSON.parse(process.argv[2]!) as Pal;
const MB: Record<T, string> = Object.fromEntries(TERRAINS.map((t) => [t, ({ forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' } as Record<string, string>)[t] ?? desat(BRIGHT[t], 0.8)])) as Record<T, string>;
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
const heatAt = (t: number) => { const x = Math.max(0, Math.min(0.9999, t)) * 4, k = Math.floor(x), f = x - k; return over(HEAT[k]!, HEAT[k + 1]!, f); };
const heats = Array.from({ length: 41 }, (_, i) => heatAt(i / 40));
const BAN = { red: '#FD6533', green: '#00674B' };
for (const [nm, k, tgt] of [['frozen', 0, '#E8DCC2'], ['cloth 0.25', 0.25, '#E8DCC2'], ['cloth 0.35', 0.35, '#E8DCC2'], ['cloth 0.45', 0.45, '#E8DCC2'], ['grey-cool 0.35', 0.35, '#D9DEE3']] as const) {
  const base = Object.fromEntries(TERRAINS.map((t) => [t, over(MB[t], tgt, k)])) as Record<T, string>;
  let wn = { d: 1e9, s: '' }, wc = { d: 1e9, s: '' };
  for (const t of TERRAINS) for (const u of TERRAINS) { const n = dN(P[t], base[u]), c = dCvd(P[t], base[u]); if (n < wn.d) wn = { d: n, s: `${t} fill vs ${u} base ${base[u]}` }; if (c < wc.d) wc = { d: c, s: `${t} fill vs ${u} base` }; }
  let hn = 1e9; for (const t of TERRAINS) for (const h of heats) hn = Math.min(hn, dN(P[t], h));
  // within-mode: heat ramp against the bases (the data must read on the base it replaces): min over all pairs
  let hb = 1e9; for (const u of TERRAINS) for (const h of [heats[0]!, heats[40]!]) hb = Math.min(hb, dN(base[u], h));
  // dominion: mix(base, banner) at the weakest step against its base
  let dm = 1e9; for (const u of TERRAINS) for (const [n, b] of Object.entries(BAN)) { const s = n === 'red' ? 0.25 + 0.07 : 0.35 + 0.07; dm = Math.min(dm, dN(base[u], over(base[u], b, s))); }
  const Ls = TERRAINS.map((t) => f1(mLab(base[t])[0])).join('/');
  console.log(`${nm.padEnd(16)} closest painted fill vs any data base: ${f1(wn.d)} (${wn.s}) / CVD ${f1(wc.d)} (${wc.s}); painted fill vs heat ramp ${f1(hn)}; heat ends vs bases ${f1(hb)}; weakest dominion step ${f1(dm)}; base L* ${Ls}; label ink #2A1F14 on lightest base ${f1(Math.min(...TERRAINS.map((t) => wcag('#2A1F14', base[t]))))}:1`);
}
