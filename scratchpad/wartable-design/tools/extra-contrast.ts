const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const names: Record<string, string> = { 'Oak Shaving': '#EED8C2', 'Oak Buff': '#CF9C63', 'Limed Oak': '#AC8A56', 'River Oak': '#AE9474', 'Pewter Vase': '#CECECB' };
for (const [n, h] of Object.entries(names)) console.log(`${n.padEnd(14)} ${h} text ${cr('#F4EEDF', h).toFixed(2)} ink ${cr('#1C1A17', h).toFixed(2)}`);
