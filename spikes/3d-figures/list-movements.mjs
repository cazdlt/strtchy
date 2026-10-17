// Writes out/movements.json + movements.js (id, name, seed, group, bilateral) for the gallery.
import { writeFileSync } from 'node:fs';
import { CORE } from './src/poses/core.js';
const groups = { core: CORE };
for (const g of ['standing', 'wall', 'supine', 'prone', 'seated']) groups[g] = (await import(`./src/poses/${g}.js`)).MOVEMENTS;
const list = Object.entries(groups).flatMap(([group, ms]) => ms.map((m) => ({ id: m.id, name: m.name, seed: m.seed, group, bilateral: !!m.bilateral })));
writeFileSync(new URL('./out/movements.json', import.meta.url), JSON.stringify(list, null, 1));
writeFileSync(new URL('./out/movements.js', import.meta.url), `window.MOVES = ${JSON.stringify(list)};\n`);
console.log(list.length, 'movements');
