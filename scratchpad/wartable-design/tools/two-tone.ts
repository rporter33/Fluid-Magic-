const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F', 'peak granite': '#5E5953', 'mere night': '#182A36', sheet: '#E8DCC2', 'oak body': '#8C6A47' };
for (const [n, f] of Object.entries(FILLS)) {
  const ink = cr('#1C1A17', f), snow = cr('#F3F0E8', f);
  console.log(`${n.padEnd(14)} ink ${ink.toFixed(2)} snow ${snow.toFixed(2)} best ${Math.max(ink, snow).toFixed(2)}`);
}
