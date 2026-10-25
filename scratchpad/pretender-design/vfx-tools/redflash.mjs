// R/(R+G+B) (WCAG 2.2 saturated-red test, first half) and WCAG relative luminance per color.
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const L = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (h) => { const [r, g, b] = rgb(h); return r / (r + g + b || 1); };
const sets = {
  W: ['#F3E6B8', '#D9B85C', '#FFFFFF'], U: ['#3A7BD5', '#1E3F7A', '#9ED8FF'],
  B: ['#3D2B4F', '#1A1024', '#9B4DCA'], R: ['#FD6533', '#7A1E12', '#FFB347'],
  G: ['#00674B', '#244F22', '#A6D96A'],
  terrain: ['#C1D29F', '#EEBA3A', '#374C2B', '#856824', '#8DA4AD', '#1A727A', '#AE897F', '#E8DCC2', '#1C1A17'],
  hitTints: ['#FF0000', '#FF2020', '#E0503A', '#C8504A', '#B22222', '#D04030'],
};
for (const [k, v] of Object.entries(sets)) for (const h of v)
  console.log(k.padEnd(8), h, 'R/(R+G+B)=' + ratio(h).toFixed(2), ratio(h) >= 0.8 ? 'SATURATED-RED' : '', 'L=' + L(h).toFixed(3));
