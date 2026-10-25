// v2 footpath (R34) vs the spec's tracks on Mountains at the start zoom (s = 0.44 of the Mid top)
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const over = (b: string, t: string, a: number) => '#' + rgb(b).map((v, i) => Math.round(v * (1 - a) + rgb(t)[i]! * a).toString(16).padStart(2, '0')).join('');
const wc = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const M = '#8DA4AD';
for (const s of [1, 0.44]) {
  const fw = 1.95 * s, fa = 0.75 * Math.min(1, fw) * (6.4 / 11.2); // v2: 1.5 px x 1.3 wide, dash [6.4, 4.8] top px, #2B2620 at .75
  const td = 1.6 * s, ta = td >= 1 ? 0.85 : 0.85 * Math.PI * (td / 2) ** 2 / (3.5 * s); // spec: 1.6 px dots every 3.5 px, #3E3428 at .85
  console.log(`s=${s}: v2 footpath line-average alpha ${fa.toFixed(2)} -> ${wc(over(M, '#2B2620', fa), M).toFixed(2)}:1 (dash peak ${wc(over(M, '#2B2620', 0.75 * Math.min(1, fw)), M).toFixed(2)}); tracks ${ta.toFixed(2)} -> ${wc(over(M, '#3E3428', ta), M).toFixed(2)}:1 (dot peak ${wc(over(M, '#3E3428', td >= 1 ? 0.85 : 0.85 * td), M).toFixed(2)})`);
}
