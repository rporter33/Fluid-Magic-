// Review: each banner against the neutral hairline's light keyline (#F4EEDF), normal and worst deficiency (repo colour math)
import { labAs, deltaE2000, type Vision } from './colorMath.ts';
import { NATION_BANNERS, MAP_KEYLINES } from './colors.ts';
const V: Vision[] = ['protan', 'deutan', 'tritan'];
for (const B of new Set(Object.values(NATION_BANNERS).flat())) { const n = deltaE2000(labAs(B, 'normal'), labAs(MAP_KEYLINES.light, 'normal')); const c = Math.min(...V.map((v) => deltaE2000(labAs(B, v), labAs(MAP_KEYLINES.light, v)))); console.log(B, n.toFixed(1), c.toFixed(1)); }
