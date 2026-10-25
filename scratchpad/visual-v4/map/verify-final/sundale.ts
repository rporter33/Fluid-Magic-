import { labAs, deltaE2000 } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
import * as fs from 'node:fs';
const D = JSON.parse(fs.readFileSync(process.argv[2]!, 'utf8'));
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const labF = (rgb: number[]) => { const [r, g, b] = rgb.map((v) => toLin(v / 255)) as [number, number, number]; const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047, y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b, z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883; const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116); return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))] as const; };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ALB: Record<string, string> = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' };
const W: Record<string, [string, number]> = { red: ['#8F8C88', 0.1], green: ['#5E7F45', 0.06] };
const rows = [];
for (const p of D.pureCores) { const px = p.px as number[], n = px.length / 3; if (n < 40) continue; let L = 0, A = 0, B = 0; for (let k = 0; k < px.length; k += 3) { const l = labF([px[k]!, px[k + 1]!, px[k + 2]!]); L += l[0]; A += l[1]; B += l[2]; } const m = [L / n, A / n, B / n] as const;
  let e = rgb(ALB[p.terrain]!); if (p.fog === 'unexplored') e = e.map((v, j) => v + (rgb('#E8DCC2')[j]! - v) * 0.04); else if (p.fog === 'outofsight') { const Lu = 0.3 * e[0]! + 0.59 * e[1]! + 0.11 * e[2]!; e = e.map((v) => v * 0.9 + Lu * 0.1); } else if (p.domN && W[p.domN] && D.mode === 'ownership') { const w = rgb(W[p.domN]![0]), a = (W[p.domN]![1] * p.domS) / 10; e = e.map((v, j) => v + (w[j]! - v) * a); }
  const eh = '#' + e.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); rows.push({ name: p.name, t: p.terrain, fog: p.fog, wash: p.domN + p.domS, float: +deltaE2000(m, labF(e)).toFixed(2), rounded: +deltaE2000(m, labAs(eh, 'normal')).toFixed(2) }); }
rows.sort((a, b) => b.float - a.float); console.log(JSON.stringify(rows.slice(0, 5)));
