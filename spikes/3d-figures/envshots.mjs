// Cast in environments: node envshots.mjs -> out/env/<env>-<model>-<id>.jpg
// Each shot: [env, model, movement id, pose, options].
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const SHOTS = [
	['yoga', 'mei-a', 'cat-cow', 'cow', { mat: true, azimuth: 70, heightFrac: 0.42 }],
	['home', 'ruth', 'forward-fold', 'fold', { azimuth: 75, feetY: 0.82 }],
	['gym', 'karim', 'forward-fold', 'stand', { azimuth: 20, x: 0.42 }],
	['park', 'amara', 'pigeon', 'up', { azimuth: 40, heightFrac: 0.38, feetY: 0.8 }],
	['wild', 'diego', 'forward-fold', 'stand', { azimuth: 25, heightFrac: 0.42, feetY: 0.84 }],
	['country', 'priya', 'cat-cow', 'cat', { mat: true, azimuth: 65, heightFrac: 0.4, feetY: 0.8 }],
	['beach', 'sione', 'forward-fold', 'fold', { azimuth: 80, heightFrac: 0.45, feetY: 0.86 }]
];
const only = process.argv.slice(2);
mkdirSync(join(ROOT, 'out', 'env'), { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [env, model, id, pose, opts] of SHOTS) {
	if (only.length && !only.includes(env)) continue;
	const p = await b.newPage();
	p.on('pageerror', (e) => console.error(e.message));
	await p.route('http://spike.local/**', (r) => {
		const f = join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
		existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' }) : r.fulfill({ status: 404 });
	});
	await p.goto(`http://spike.local/index.html?headless&model=${model}`);
	await p.waitForFunction(() => window.apiReady);
	const url = await p.evaluate((o) => window.api.envShot(o), { env, id, pose, ...opts });
	const f = `out/env/${env}-${model}-${id}.jpg`;
	writeFileSync(join(ROOT, f), Buffer.from(url.split(',')[1], 'base64'));
	console.log(f);
	await p.close();
}
await b.close();
