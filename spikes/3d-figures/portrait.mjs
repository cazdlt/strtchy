// Face close-ups (rest pose) for one model: out/<MODEL>/face.png  (front, 3/4, side)
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const ROOT = dirname(fileURLToPath(import.meta.url));
const MODEL = process.env.MODEL ?? 'v2';
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.error(e.message));
await p.route('http://spike.local/**', (r) => {
	const f = join(ROOT, new URL(r.request().url()).pathname);
	existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' }) : r.fulfill({ status: 404 });
});
await p.goto(`http://spike.local/index.html?headless&model=${MODEL}`);
await p.waitForFunction(() => window.apiReady);
import { mkdirSync } from 'node:fs';
mkdirSync(join(ROOT, 'out', MODEL), { recursive: true });
const files = [];
for (const [i, az] of [0, 35, 90].entries()) {
	const url = await p.evaluate((az) => window.api.portrait({ size: 400, view: { azimuth: az, elevation: 4 } }), az);
	const f = join(ROOT, 'out', `_f${i}.png`);
	writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
	files.push(f);
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]), '-f', 'lavfi', '-i', 'color=c=0xf5f1ea:s=1200x400',
	'-filter_complex', '[0][1][2]hstack=inputs=3[r];[3][r]overlay', '-frames:v', '1', join(ROOT, 'out', MODEL, 'face.png')]);
await b.close();
