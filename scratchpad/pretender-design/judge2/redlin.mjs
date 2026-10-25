const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const r8 = (h) => { const [r, g, b] = rgb(h); return r / (r + g + b); };
const rl = (h) => { const [r, g, b] = rgb(h).map(lin); return r / (r + g + b); };
for (const h of ['#FD6533', '#7A1E12', '#FFB347', '#C8504A', '#E0503A', '#C9A6EA', '#9B4DCA', '#A6D96A'])
  console.log(h, 'gamma', r8(h).toFixed(2), 'linear', rl(h).toFixed(2), rl(h) >= 0.8 ? 'SATURATED (linear)' : '');
