// Exact best-keyline contrast per ground with docs/09's keylines (#F4EEDF light, #1C1A17 dark).
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const L = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const ter = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD',
  Swamp: '#1A727A', Wasteland: '#AE897F', Parchment: '#E8DCC2', DarkUI: '#1C1A17' };
for (const [t, f] of Object.entries(ter)) {
  const l = cr('#F4EEDF', f), d = cr('#1C1A17', f);
  console.log(t.padEnd(10), 'light', l.toFixed(3), 'dark', d.toFixed(3), 'best', Math.max(l, d).toFixed(3), l > d ? 'light' : 'dark');
}
