// Review: natural water and snow against the natural grounds (repo colour math). Grounds: natural-grounds.json (7 quantiles per terrain within 0.12 D of borders).
import { labAs, deltaE2000, type Vision } from './colorMath.ts';
import { contrastRatio } from './colors.ts';
import * as fs from 'node:fs';
const G = JSON.parse(fs.readFileSync(new URL('./natural-grounds.json', import.meta.url), 'utf8')) as Record<string, string[]>;
const T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland'];
const V: Vision[] = ['protan', 'deutan', 'tritan'];
const dN = (a: string, b: string) => deltaE2000(labAs(a, 'normal'), labAs(b, 'normal')); const dC = (a: string, b: string) => Math.min(...V.map((v) => deltaE2000(labAs(a, v), labAs(b, v))));
const WATER = '#14615B';
for (const t of T) { const g = G[t]!; const n = Math.min(...g.map((x) => dN(WATER, x))), c = Math.min(...g.map((x) => dC(WATER, x))), cr = Math.min(...g.map((x) => contrastRatio(WATER, x))); const med = g[3]!; console.log(`water vs ${t}: min over quantiles ${n.toFixed(1)} / ${c.toFixed(1)}; median ground ${dN(WATER, med).toFixed(1)} / ${dC(WATER, med).toFixed(1)}; min luminance contrast ${cr.toFixed(2)}`); }
for (const w of ['#24222A', '#2A292C']) console.log(`water vs ${w}: ${dN(WATER, w).toFixed(1)} / ${dC(WATER, w).toFixed(1)}`);
// natural materials named in the design (§2.2), against snow
const MAT = ['#65692D', '#6E7734', '#766E38', '#6C6E37', '#937C49', '#97845B', '#6A7139', '#786246', '#7D754A', '#3C4926', '#3C4621', '#21330D', '#1E2C15', '#625031', '#606131', '#6D5230', '#7D766D', '#61636B', '#757478', '#515537', '#4F532C', '#2F3F38', '#6C6432', '#313D20', '#937E64', '#796855', '#56563D', '#9D8B76', '#14615B'];
const SNOW = '#F2EEE6'; let wn = 99, wc = 99; for (const m of MAT) { wn = Math.min(wn, dN(m, SNOW)); wc = Math.min(wc, dC(m, SNOW)); } console.log(`snow vs every natural material: ${wn.toFixed(1)} / ${wc.toFixed(1)}`);
// OKLCH chroma of the materials
const s2l = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const okC = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => s2l(parseInt(h.slice(i, i + 2), 16))) as [number, number, number]; const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s); };
console.log('max OKLCH C of the materials', Math.max(...MAT.map(okC)).toFixed(3), MAT.filter((m) => okC(m) > 0.09).join(' '));
