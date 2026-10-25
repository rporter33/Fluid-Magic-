import { validateContent, nationDef } from '/home/user/fm-6b3/src/content';
import { PRESETS } from '/home/user/fm-6b3/src/content/pretenders/presets';
import { designCost, designBudget, validatePretender, availableChassis } from '/home/user/fm-6b3/src/sim/pretender';
console.log(validateContent());
for (const p of PRESETS) { const d = nationDef(p.nation); console.log(p.id, designCost(d, p.design), designBudget(p.design.awakening), validatePretender(d, p.design)); }
console.log(availableChassis(nationDef('cinderHorde')).map(c=>c.id), availableChassis(nationDef('thornwood')).map(c=>c.id));
