import { unitDef } from '/home/user/Fluid-Magic-/src/content';
import { UNITS } from '/home/user/Fluid-Magic-/src/content/units';
const ids = Object.keys(UNITS) as (keyof typeof UNITS)[];
function time(label: string, f: () => void, n = 20000) { for (let i=0;i<1000;i++) f(); const t = performance.now(); for (let i = 0; i < n; i++) f(); console.log(label, ((performance.now() - t) / n * 1000).toFixed(3), 'us'); }
time('unitDef x all', () => { for (const id of ids) unitDef(id); });
time('tags.includes x all', () => { for (const id of ids) unitDef(id).tags.includes('stealthy'); });
console.log(ids.length, 'units', '%HasFastProperties' );
