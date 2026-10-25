// WCAG 2.2 "saturated red": R/(R+G+B) >= 0.8 with R, G, B the linearized sRGB values of the
// "relative luminance" definition (judge 2's reading; the conservative one, since linearizing raises
// the red share of every red). Prints both readings for every docs/09 palette step and candidates.
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const gamma = (h) => { const [r, g, b] = rgb(h); return r / (r + g + b); };
const linear = (h) => { const [r, g, b] = rgb(h).map(lin); return r / (r + g + b); };
const rows = {
  'W primary': '#F3E6B8', 'W secondary': '#D9B85C', 'W accent': '#FFFFFF',
  'U primary': '#3A7BD5', 'U secondary': '#1E3F7A', 'U accent': '#9ED8FF',
  'B primary': '#3D2B4F', 'B secondary': '#1A1024', 'B accent': '#9B4DCA', 'B rim (derived)': '#C9A6EA',
  'R primary': '#FD6533', 'R secondary': '#7A1E12', 'R accent': '#FFB347',
  'G primary': '#00674B', 'G secondary': '#244F22', 'G accent': '#A6D96A',
  'battle fire glow': '#FFB347',
  'research-vfx hit tint proposal': '#C8504A', 'battle proposal red': '#E0503A',
  'candidate hit tint A': '#D0605A', 'candidate hit tint B': '#C86A5A', 'candidate vein': '#B8605A', 'candidate ember mote': '#F08A4B',
  'candidate R flash (pale)': '#FFD08A',
};
for (const [k, h] of Object.entries(rows)) {
  const L = linear(h);
  console.log(`| ${k} | \`${h}\` | ${gamma(h).toFixed(3)} | ${L.toFixed(3)} | ${L >= 0.8 ? 'saturated red' : 'passes'} |`);
}
