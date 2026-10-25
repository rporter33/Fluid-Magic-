// Contrast of text, dim text, deltas and brass on the proposed dark-oak chrome surfaces.
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const mix = (a: string, b: string, t: number) => '#' + rgb(a).map((v, i) => Math.round(v * t + rgb(b)[i]! * (1 - t)).toString(16).padStart(2, '0')).join('').toUpperCase();
const surfaces = { 'chrome-0 #1C1A17': '#1C1A17', 'oak-0 #2B231C': '#2B231C', 'oak-grain #3A2E23': '#3A2E23', 'oak-grain-max #45372A': '#45372A', 'leather #4A3426': '#4A3426' };
for (const [n, s] of Object.entries(surfaces)) {
  const dim = mix('#F4EEDF', s, 0.6);
  console.log(`${n.padEnd(24)} text ${cr('#F4EEDF', s).toFixed(2)} | dim(60%) ${dim} ${cr(dim, s).toFixed(2)} | warm #E8A15A ${cr('#E8A15A', s).toFixed(2)} | cool #8DB6C8 ${cr('#8DB6C8', s).toFixed(2)} | brass #B8914A ${cr('#B8914A', s).toFixed(2)} | focus ${cr('#F4EEDF', s).toFixed(2)}`);
}
// Wild slate label and rim
console.log('wild label #E9E4D8 on #24222A', cr('#E9E4D8', '#24222A').toFixed(2));
// Sheet: ink on parchment, and parchment vs oak table (sheet edge must read)
for (const oak of ['#A7855A', '#8F7459', '#96724C', '#715636']) console.log(`sheet #E8DCC2 vs oak ${oak}: ${cr('#E8DCC2', oak).toFixed(2)}`);
