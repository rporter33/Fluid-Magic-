// Region ink on Wasteland's worst painted variant: ink alpha and knock-out halo strength options.
import { over, wcag, STATES, stOver, f2 } from './lib';
import { paintVars, REC_PAINTED } from './eval';
const f = '#958081'; const vs = paintVars(f, REC_PAINTED.wasteland, 1).flatMap((x) => STATES.map((s) => stOver(x, s, f)));
for (const [ia, ha] of [[0.9, 0.5], [1, 0.5], [0.9, 0.65], [1, 0.65]] as const) console.log(`ink #2A1F14 at ${ia}, halo of the fill at ${ha}: worst ${f2(Math.min(...vs.map((g) => { const gr = over(g, f, ha); return wcag(over(gr, '#2A1F14', ia), gr); })))}:1`);
