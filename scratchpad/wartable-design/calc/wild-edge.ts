// Edge legibility of the chosen wild slate #24222A and its rim ticks #E9E4D8 against each terrain.
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
const cr = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const T: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const W = '#24222A', TICK = '#E9E4D8';
for (const [n, h] of Object.entries(T)) console.log(`${n.padEnd(10)} slate ${cr(W, h).toFixed(2)}  tick ${cr(TICK, h).toFixed(2)}  best ${Math.max(cr(W, h), cr(TICK, h)).toFixed(2)}`);
console.log('tick on slate', cr(TICK, W).toFixed(2), '| label #E9E4D8 on slate', cr('#E9E4D8', W).toFixed(2), '| snow #E9E4D8; rock face #6B6775 on slate', cr('#6B6775', W).toFixed(2));
