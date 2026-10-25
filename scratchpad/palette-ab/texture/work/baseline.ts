import { BRIGHT, TERRAINS, oklch, lch, closest, VISIONS, dAll, dN, dCvd, f1, f3, desat, keylineFor, wcag } from './lib';
const say = (s = '') => console.log(s);
say('# Baseline: the approved fills');
let sum = 0;
for (const t of TERRAINS) { const o = oklch(BRIGHT[t]), c = lch(BRIGHT[t]); sum += o.C; say(`${t.padEnd(10)} ${BRIGHT[t]} OKLCH L ${f3(o.L)} C ${f3(o.C)} h ${f1(o.h)} | CIELAB L* ${f1(c.L)} C* ${f1(c.C)} h ${f1(c.h)} | keyline ${keylineFor(BRIGHT[t])} ${f1(wcag(keylineFor(BRIGHT[t]), BRIGHT[t]))}:1`); }
say(`mean OKLCH C ${f3(sum / 7)}; 60% budget ${f3(0.6 * sum / 7)}`);
for (const v of VISIONS) { const c = closest(BRIGHT, v); say(`closest ${v}: ${c.a}/${c.b} ${f1(c.d)}`); }
const WILD = { peaksGround: '#2A292C', mereGround: '#24222A', peakLit: '#8A857E', peakShade: '#46423F', snow: '#F2EEE6', mereRipple: '#8FC3D3', mereShore: '#2E3138' };
say('\n## wild grounds vs fills (approved)');
for (const [k, w] of Object.entries(WILD).slice(0, 2)) { let wn = { d: 1e9, t: '' }, wc = { d: 1e9, t: '' }; for (const t of TERRAINS) { const n = dN(w, BRIGHT[t]), c = dCvd(w, BRIGHT[t]); if (n < wn.d) wn = { d: n, t }; if (c < wc.d) wc = { d: c, t }; } say(`${k} ${w}: closest normal ${wn.t} ${f1(wn.d)}, CVD ${wc.t} ${f1(wc.d)}`); }
const MODE_BASE = Object.fromEntries(TERRAINS.map((t) => [t, ({ forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' } as Record<string, string>)[t] ?? desat(BRIGHT[t], 0.8)]));
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'];
say('\n## data-mode colors vs fills (approved)'); say('MODE_BASE ' + JSON.stringify(MODE_BASE));
for (const t of TERRAINS) { const own = dAll(BRIGHT[t], MODE_BASE[t]!); let wn = { d: 1e9, k: '' }; for (const [k, m] of [...Object.entries(MODE_BASE), ...HEAT.map((h, i) => ['heat' + i, h] as [string, string])]) { const n = dN(BRIGHT[t], m); if (n < wn.d) wn = { d: n, k }; } say(`${t.padEnd(10)} vs own mode base ${f1(own.normal)}/${f1(Math.min(own.protan, own.deutan, own.tritan))}; nearest data color ${wn.k} ${f1(wn.d)}`); }
