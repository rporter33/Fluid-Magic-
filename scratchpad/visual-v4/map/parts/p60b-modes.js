
// ------------------------------------------------------------------ data-mode colours (the opaque mode raster's fills; frozen as approved, natural §9)
// Palette A/B: the data-mode bases are built from the approved fills and stay frozen under Painted (only the Farmland A/B moves Farmland's, on Bright)
const MODE_BASE = Object.fromEntries(Object.entries(PALETTES.bright).map(([t, f]) => [t, { forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' }[t] ?? desat(f, 0.8)]));
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'].map(hex2rgb);
function heat(t) { // 0..1 -> a lightness-carrying ramp (L* 41 to 91), readable without hue
  const x = Math.max(0, Math.min(0.9999, t)) * (HEAT.length - 1), k = Math.floor(x), f = x - k, a = HEAT[k], b = HEAT[k + 1];
  return rgb2hex(a.map((v, j) => v + (b[j] - v) * f));
}
const FILLMEMO = new Map();
function fillFor(p) {
  const fog = fogOf(p.i), hid = fog === 'unexplored', base = MODE_BASE[p.terrain];
  const memo = (k, fn) => { let v = FILLMEMO.get(k); if (!v) { v = fn(); FILLMEMO.set(k, v); } return v; };
  switch (state.mode) {
    case 'dominion': return hid || !p.dom.n ? base : memo(`d${p.terrain}${p.dom.n}${p.dom.s}`, () => mix(base, BAN[p.dom.n], p.dom.n === 'red' ? 0.25 + p.dom.s * 0.07 : 0.35 + p.dom.s * 0.07));
    case 'supply': return hid ? base : heat(((SUPPLY[p.terrain] + p.pop / 50) * p4SupplyK()) / 320); // pass 4: the season's factor (p58s)
    case 'unrest': return hid ? base : heat(p.unrest / 60);
    case 'population': return hid ? base : heat((Math.log(p.pop) / Math.log(26000)) * 1.15 - 0.55);
    case 'springs': return base;
    default: {
      const f = TERRAIN[p.terrain].fill;
      if (PAINTED()) return f; // v3: the plain terrain fill; the live state overlay draws haze, sight and the land-look wash (H10)
      if (hid) return memo('u' + f, () => mix(f, '#E8DCC2', 0.04));
      if (fog === 'outofsight') return memo('o' + f, () => desat(f, 0.1));
      if (!p.dom.n) return f;
      return memo(`w${f}${p.dom.n}${p.dom.s}`, () => mix(f, p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', (p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s / 10));
    }
  }
}
