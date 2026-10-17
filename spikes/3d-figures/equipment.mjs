// Equipment scale check: MODEL=<cast id> node equipment.mjs -> out/equipment.png
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('console', (m) => m.type() === 'warning' && console.log('[page]', m.text()));
p.on('pageerror', (e) => console.error(e.message));
await p.route('http://spike.local/**', (r) => {
	const f = join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
	existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' }) : r.fulfill({ status: 404 });
});
await p.goto(`http://spike.local/index.html?headless&model=${process.env.MODEL ?? 'mei-a'}`);
await p.waitForFunction(() => window.apiReady);
const url = await p.evaluate(() => window.api.equipment());
writeFileSync(join(ROOT, 'out', 'equipment.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('out/equipment.png');
await b.close();
