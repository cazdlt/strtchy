// Renders static icons + looping videos for every movement in src/poses.js.
//   node render.mjs                 -> everything
//   node render.mjs stills          -> icons only
//   node render.mjs debug           -> print skeleton dimensions
//   node render.mjs stills cat-cow  -> one movement
//   MODEL=v1 node render.mjs        -> render with models/v1.glb (default v2)
// Files are served through request interception, so no dev server is needed.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MODEL = process.env.MODEL ?? 'v2';
const OUT = join(ROOT, 'out', MODEL);
const ORIGIN = 'http://spike.local';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json' };
const BG = { dark: '0x151515', light: '0xf5f1ea' };

const [mode = 'all', only] = process.argv.slice(2);

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
page.on('console', (m) => m.type() !== 'debug' && console.log('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.route(`${ORIGIN}/**`, (route) => {
	const path = join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
	if (!existsSync(path)) return route.fulfill({ status: 404 });
	route.fulfill({ body: readFileSync(path), contentType: MIME[extname(path)] ?? 'application/octet-stream' });
});

const dataUrlToBuffer = (url) => Buffer.from(url.split(',')[1], 'base64');

if (mode === 'debug') {
	await page.goto(`${ORIGIN}/index.html?headless&model=${MODEL}`);
	await page.waitForFunction(() => window.apiReady, null, { timeout: 60_000 });
	const dims = await page.evaluate(async () => {
		const { loadFigure } = await import('./src/rig.js');
		const fig = await loadFigure(`./models/${new URLSearchParams(location.search).get('model')}.glb`);
		const r = (v) => v.toArray().map((x) => +x.toFixed(3));
		return Object.fromEntries(
			fig.order.filter((n) => !n.startsWith('bone_')).map((n) => [n, { pos: r(fig.rest[n].worldPos), dir: r(fig.rest[n].D0), len: +fig.rest[n].length.toFixed(3) }])
		);
	});
	console.table(dims);
	await browser.close();
	process.exit(0);
}

await page.goto(`${ORIGIN}/index.html?headless&model=${MODEL}`);
await page.waitForFunction(() => window.apiReady, null, { timeout: 60_000 });
const movements = (await page.evaluate(() => window.api.movements)).filter((m) => !only || m.id === only);

if (mode === 'views') {
	// Debug: every pose from front / left / back / top, one row per pose.
	const VIEWS = [{ azimuth: 0, elevation: 5 }, { azimuth: 90, elevation: 5 }, { azimuth: 180, elevation: 5 }, { azimuth: 30, elevation: 80 }];
	const dir = join(OUT, 'views');
	mkdirSync(dir, { recursive: true });
	for (const m of movements) {
		const rows = [];
		for (const pose of m.poses) {
			const cells = [];
			for (const [i, view] of VIEWS.entries()) {
				const url = await page.evaluate(([id, pose, view]) => window.api.still(id, { size: 320, pose, view }), [m.id, pose, view]);
				const f = join(dir, `_${m.id}-${pose}-${i}.png`);
				writeFileSync(f, dataUrlToBuffer(url));
				cells.push(f);
			}
			rows.push(cells);
		}
		const inputs = rows.flat().flatMap((f) => ['-i', f]);
		const n = rows.flat().length;
		const grid = `${rows.flat().map((_, i) => `[${i}]`).join('')}xstack=inputs=${n}:layout=${rows.flatMap((r, y) => r.map((_, x) => `${x * 320}_${y * 320}`)).join('|')}[g]`;
		execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-f', 'lavfi', '-i', `color=c=0xe8e4dd:s=${4 * 320}x${rows.length * 320}`,
			'-filter_complex', `${grid};[${n}][g]overlay`, '-frames:v', '1', join(dir, `${m.id}.png`)]);
		console.log('views', join(dir, `${m.id}.png`), m.poses.join(' / '));
	}
	await browser.close();
	process.exit(0);
}

mkdirSync(join(OUT, 'icons'), { recursive: true });
mkdirSync(join(OUT, 'video'), { recursive: true });

for (const m of movements) {
	if (mode === 'all' || mode === 'stills') {
		const variants = m.bilateral ? [false, true] : [false];
		for (const mirrored of variants) {
			const url = await page.evaluate(([id, mirrored]) => window.api.still(id, { size: 1024, mirrored }), [m.id, mirrored]);
			const file = join(OUT, 'icons', `${m.id}${mirrored ? '-other-side' : ''}.png`);
			writeFileSync(file, dataUrlToBuffer(url));
			console.log('icon', file);
		}
	}

	if (mode === 'all' || mode === 'video') {
		const fps = 30;
		const frameDir = join(OUT, 'frames', m.id);
		rmSync(frameDir, { recursive: true, force: true });
		mkdirSync(frameDir, { recursive: true });
		const count = await page.evaluate(([id, fps]) => window.api.prepareAnimation(id, { size: 720, fps }), [m.id, fps]);
		for (let i = 0; i < count; i++) {
			const url = await page.evaluate((i) => window.api.frame(i), i);
			writeFileSync(join(frameDir, `${String(i).padStart(4, '0')}.png`), dataUrlToBuffer(url));
		}
		for (const [theme, color] of Object.entries(BG)) {
			const file = join(OUT, 'video', `${m.id}-${theme}.mp4`);
			execFileSync('ffmpeg', [
				'-y', '-loglevel', 'error',
				'-f', 'lavfi', '-i', `color=c=${color}:s=720x720:r=${fps}`,
				'-framerate', String(fps), '-i', join(frameDir, '%04d.png'),
				'-filter_complex', '[0][1]overlay=shortest=1,format=yuv420p',
				'-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an',
				file
			]);
			console.log('video', file, `(${count} frames)`);
		}
	}
}

await browser.close();
