// Simulated-vision sRGB for the swatch strip: the repo's labAs (Machado 2009 in linear RGB, then CIELAB) back to hex.
import { TERRAINS, CURRENT, labAs, VISIONS, fromLab, type T } from './lib.ts';
const P: Record<T, string> = JSON.parse(process.argv[2]!);
const out: Record<string, Record<string, Record<string, string>>> = { proposed: {}, approved: {} };
for (const [k, pal] of [['proposed', P], ['approved', CURRENT]] as const) for (const v of VISIONS) out[k]![v] = Object.fromEntries(TERRAINS.map((t) => [t, fromLab(labAs(pal[t], v))]));
console.log(JSON.stringify(out));
