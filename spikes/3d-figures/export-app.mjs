// Exports the app's movement art and routine covers into the SvelteKit app:
//   static/assets/movements/3d/<slug>.webp            transparent icon (512 px)
//   static/assets/movements/3d/<slug>-{dark,light}.mp4 looping preview (540 px)
//   static/assets/routines/<slug>.jpg                  routine cover (env plate + cast)
//   src/lib/art/manifest.json                          seed name -> files
// Each movement is illustrated by a different cast member (CAST rotation, or
// CAST_FOR overrides), so the library shows the whole cast.
//   node export-app.mjs [movements|covers|all] [id...]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const APP = join(ROOT, '..', '..');
const ICONS = join(APP, 'static/assets/movements/3d');
const COVERS = join(APP, 'static/assets/routines');
const MANIFEST = join(APP, 'src/lib/art/manifest.json');
const TMP = join(ROOT, 'out', '_export');
const ORIGIN = 'http://spike.local';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const BG = { dark: '0x151515', light: '0xf5f1ea' };
const FPS = 30;

export const CAST = ['mei-a', 'c1a', 'ruth', 'diego', 'amara', 'karim', 'lucia', 'sione', 'priya', 'kenji'];
// Per-movement casting where it matters (e.g. a hang reads best on a light body).
const CAST_FOR = {};

// Built-in routines (seed names) -> cover shot. pose/opts as api.envShot.
const COVER_SHOTS = {
	'15-Minute Full Body': { env: 'home', model: 'lucia', id: 'downward-dog', pose: null, opts: { azimuth: 70, heightFrac: 0.42 } },
	'Cimientos y Cadena Posterior': { env: 'park', model: 'diego', id: 'calf-stretch', pose: null, opts: { azimuth: 60, heightFrac: 0.45, feetY: 0.84 } },
	'Desbloqueo de Cadera': { env: 'yoga', model: 'mei-a', id: 'pigeon', pose: 'fold', opts: { azimuth: 45, heightFrac: 0.45 } },
	'Hombros Blindados': { env: 'gym', model: 'karim', id: 'band-pull-aparts', pose: null, opts: { azimuth: 25, heightFrac: 0.5 } },
	'Piernas Frescas': { env: 'country', model: 'amara', id: 'supine-hamstring-stretch', pose: null, opts: { azimuth: 75, heightFrac: 0.42, feetY: 0.8 } },
	'Estiramiento Nocturno': { env: 'beach', model: 'kenji', id: 'knees-to-chest', pose: null, opts: { azimuth: 75, heightFrac: 0.45, feetY: 0.86 } }
};
// Full-bleed backgrounds for the sign-in / sign-up pages (static/assets/hero/<name>.jpg).
const HEROES = {
	login: { env: 'country', model: 'amara', id: 'pigeon', pose: 'up', opts: { azimuth: 35, heightFrac: 0.36, feetY: 0.78, x: 0.68 } },
	register: { env: 'yoga', model: 'kenji', id: 'forward-fold', pose: 'stand', opts: { azimuth: 25, heightFrac: 0.5, feetY: 0.86, x: 0.7 } }
};
// Plates for routines without a cover shot (custom routines), picked by hash.
const PLATES = ['yoga', 'home', 'gym', 'park', 'wild', 'country', 'beach'];

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const [mode = 'all', ...only] = process.argv.slice(2);

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
async function openModel(model) {
	const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
	page.on('pageerror', (e) => console.error('[page error]', e.message));
	await page.route(`${ORIGIN}/**`, (route) => {
		const path = join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
		if (!existsSync(path)) return route.fulfill({ status: 404 });
		route.fulfill({ body: readFileSync(path), contentType: MIME[extname(path)] ?? 'application/octet-stream' });
	});
	await page.goto(`${ORIGIN}/index.html?headless&model=${model}`);
	await page.waitForFunction(() => window.apiReady, null, { timeout: 60_000 });
	return page;
}
const dataUrl = (url) => Buffer.from(url.split(',')[1], 'base64');
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { movements: {}, routines: {}, plates: [] };
mkdirSync(ICONS, { recursive: true });
mkdirSync(COVERS, { recursive: true });
mkdirSync(dirname(MANIFEST), { recursive: true });
mkdirSync(TMP, { recursive: true });

if (mode === 'all' || mode === 'movements') {
	const probe = await openModel(CAST[0]);
	const all = (await probe.evaluate(() => window.api.movements)).filter((m) => m.seed && (!only.length || only.includes(m.id)));
	await probe.close();
	const byModel = new Map();
	const allIds = (await import('./src/poses.js')).MOVEMENTS.filter((m) => m.seed).map((m) => m.id);
	for (const m of all) {
		const model = CAST_FOR[m.id] ?? CAST[allIds.indexOf(m.id) % CAST.length];
		if (!byModel.has(model)) byModel.set(model, []);
		byModel.get(model).push(m);
	}
	for (const [model, list] of byModel) {
		const page = await openModel(model);
		for (const m of list) {
			const s = slug(m.seed);
			const png = join(TMP, `${s}.png`);
			writeFileSync(png, dataUrl(await page.evaluate((id) => window.api.still(id, { size: 1024 }), m.id)));
			run('magick', [png, '-trim', '-resize', '460x460', '-gravity', 'center', '-background', 'none', '-extent', '512x512', '-quality', '82', join(ICONS, `${s}.webp`)]);
			const frames = join(TMP, s);
			rmSync(frames, { recursive: true, force: true });
			mkdirSync(frames, { recursive: true });
			const count = await page.evaluate(([id, fps]) => window.api.prepareAnimation(id, { size: 540, fps }), [m.id, FPS]);
			for (let i = 0; i < count; i++) writeFileSync(join(frames, `${String(i).padStart(4, '0')}.png`), dataUrl(await page.evaluate((i) => window.api.frame(i), i)));
			for (const [theme, color] of Object.entries(BG)) {
				run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=${color}:s=540x540:r=${FPS}`, '-framerate', String(FPS), '-i', join(frames, '%04d.png'),
					'-filter_complex', '[0][1]overlay=shortest=1,format=yuv420p', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', '-an', join(ICONS, `${s}-${theme}.mp4`)]);
			}
			rmSync(frames, { recursive: true, force: true });
			manifest.movements[m.seed] = { icon: `/assets/movements/3d/${s}.webp`, dark: `/assets/movements/3d/${s}-dark.mp4`, light: `/assets/movements/3d/${s}-light.mp4`, cast: model, bilateral: m.bilateral };
			console.log('movement', m.seed, '->', model);
		}
		await page.close();
	}
}

if (mode === 'all' || mode === 'covers') {
	for (const [routine, shot] of Object.entries(COVER_SHOTS)) {
		if (only.length && !only.includes(slug(routine))) continue;
		const page = await openModel(shot.model);
		const ms = await page.evaluate(() => window.api.movements);
		const m = ms.find((x) => x.id === shot.id);
		if (!m) {
			console.warn('cover skipped (movement not posed yet):', routine, shot.id);
			await page.close();
			continue;
		}
		const url = await page.evaluate((o) => window.api.envShot(o), { env: shot.env, id: shot.id, pose: shot.pose ?? m.icon, width: 1200, height: 800, ...shot.opts });
		const jpg = join(COVERS, `${slug(routine)}.jpg`);
		const tmp = join(TMP, 'cover.jpg');
		writeFileSync(tmp, dataUrl(url));
		run('magick', [tmp, '-quality', '78', jpg]);
		manifest.routines[routine] = `/assets/routines/${slug(routine)}.jpg`;
		console.log('cover', routine);
		await page.close();
	}
	mkdirSync(join(APP, 'static/assets/hero'), { recursive: true });
	for (const [name, shot] of Object.entries(HEROES)) {
		const page = await openModel(shot.model);
		const m = (await page.evaluate(() => window.api.movements)).find((x) => x.id === shot.id);
		if (m) {
			const url = await page.evaluate((o) => window.api.envShot(o), { env: shot.env, id: shot.id, pose: shot.pose ?? m.icon, width: 1600, height: 1000, ...shot.opts });
			const tmp = join(TMP, 'hero.jpg');
			writeFileSync(tmp, dataUrl(url));
			run('magick', [tmp, '-quality', '76', join(APP, 'static/assets/hero', `${name}.jpg`)]);
			console.log('hero', name);
		}
		await page.close();
	}
	// Bare plates for custom routines.
	manifest.plates = [];
	for (const env of PLATES) {
		run('magick', [join(ROOT, 'env', `${env}.png`), '-gravity', 'center', '-crop', '95%x95%+0+0', '+repage', '-resize', '1200x800^', '-extent', '1200x800', '-quality', '75', join(COVERS, `plate-${env}.jpg`)]);
		manifest.plates.push(`/assets/routines/plate-${env}.jpg`);
	}
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');
console.log('manifest', MANIFEST);
await browser.close();
