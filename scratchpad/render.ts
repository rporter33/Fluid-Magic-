import { writeFileSync } from 'node:fs';
import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '../../../../../home/user/Fluid-Magic-/src/content/terrain';
import { COLOR_DEFS } from '../../../../../home/user/Fluid-Magic-/src/content/colors';
const seed = Number(process.argv[2] ?? 1); const nations = Number(process.argv[3] ?? 2);
const caps = [{ color: 'R', terrain: 'plains', name: 'Kharnath' }, { color: 'G', terrain: 'forest', name: 'Deepmoss' }, { color: 'R', terrain: 'plains', name: 'Kharnath' }, { color: 'G', terrain: 'forest', name: 'Deepmoss' }].slice(0, nations) as any;
const m = generateMap({ seed, size: 'medium', capitals: caps });
const ps = Object.values(m.provinces);
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 ${m.width + 20} ${m.height + 20}" width="${(m.width + 20) * 1.6}" height="${(m.height + 20) * 1.6}" font-family="sans-serif"><style>text{paint-order:stroke;stroke:#1C1A17;stroke-width:1.6px;stroke-linejoin:round}</style>`;
s += `<rect x="-10" y="-10" width="${m.width + 20}" height="${m.height + 20}" fill="#1C1A17"/>`;
s += `<polygon points="${m.outline.map(p => `${p.x},${p.y}`).join(' ')}" fill="#E8DCC2"/>`;
for (const p of ps) s += `<polygon points="${p.polygon.map(q => `${q.x},${q.y}`).join(' ')}" fill="${TERRAIN[p.terrain].fill}" stroke="#2B2620" stroke-width="1"/>`;
for (const p of ps) for (const n of p.neighbors) { const q = m.provinces[n]; if (p.id < n) s += `<line x1="${p.center.x}" y1="${p.center.y}" x2="${q.center.x}" y2="${q.center.y}" stroke="#ffffff" stroke-opacity="0.25" stroke-width="0.8"/>`; }
for (const p of ps) {
  const cap = p.capitalSlot !== undefined, well = p.wellspring !== undefined;
  s += `<text x="${p.center.x}" y="${p.center.y - 4}" font-size="${cap ? 9 : 6.5}" text-anchor="middle" fill="#F4EEDF" font-weight="${cap || well ? 700 : 400}">${p.name}</text>`;
  s += `<text x="${p.center.x}" y="${p.center.y + 5}" font-size="5.5" text-anchor="middle" fill="#F4EEDF">${cap ? 'CAPITAL' : well ? `WELL ${p.wellspring!.axis}${p.wellspring!.step > 0 ? '+' : '-'} g${p.independentStrength}` : `d${p.capitalDistance} g${p.independentStrength}`}</text>`;
  p.springs.slice(0, 4).forEach((c, k) => { s += `<circle cx="${p.center.x - 6 + k * 4.5}" cy="${p.center.y + 10}" r="2" fill="${COLOR_DEFS[c].palette.primary}" stroke="#000" stroke-width="0.4"/>`; });
  if (well) s += `<circle cx="${p.center.x}" cy="${p.center.y}" r="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="4 3"/>`;
}
s += '</svg>';
writeFileSync(`${process.argv[4]}`, s);
