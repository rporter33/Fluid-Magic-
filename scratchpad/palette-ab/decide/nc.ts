import { NATIONS } from '/home/user/Fluid-Magic-/src/content/nations/index.ts';
console.log(JSON.stringify([...new Set(Object.values(NATIONS).map((n) => n.colors[0]))]));
