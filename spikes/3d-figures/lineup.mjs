// Cast line-up at true relative heights: node lineup.mjs id1 id2 ... -> out/lineup.png
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const ROOT = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const files = [];
for (const id of ids) {
	const p = await b.newPage();
	p.on('pageerror', (e) => console.error(e.message));
	await p.route('http://spike.local/**', (r) => {
		const f = join(ROOT, new URL(r.request().url()).pathname);
		existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' }) : r.fulfill({ status: 404 });
	});
	await p.goto(`http://spike.local/index.html?headless&model=${id}`);
	await p.waitForFunction(() => window.apiReady);
	const url = await p.evaluate(() => window.api.lineup());
	const f = join(ROOT, 'out', `_l${files.length}.png`);
	writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
	files.push(f);
	await p.close();
}
await b.close();
const n = files.length;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]), '-f', 'lavfi', '-i', `color=c=0xf5f1ea:s=${300 * n}x640`,
	'-filter_complex', `${files.map((_, i) => `[${i}]`).join('')}hstack=inputs=${n}[r];[${n}][r]overlay`, '-frames:v', '1', join(ROOT, 'out', 'lineup.png')]);
console.log('out/lineup.png');
