// Bind pose vs posed 'stand' (front): out/<MODEL>/body.png. Shows what is mesh vs skinning.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.cwd(), MODEL = process.env.MODEL;
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.error(e.message));
await p.route('http://spike.local/**', (r) => { const f = join(ROOT, new URL(r.request().url()).pathname); existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: extname(f) === '.js' ? 'text/javascript' : extname(f) === '.html' ? 'text/html' : 'application/octet-stream' }) : r.fulfill({ status: 404 }); });
await p.goto(`http://spike.local/index.html?headless&model=${MODEL}`); await p.waitForFunction(() => window.apiReady);
const rest = await p.evaluate(() => window.api.rest({ size: 700 }));
writeFileSync(`out/_rest.png`, Buffer.from(rest.split(',')[1], 'base64'));
const st = await p.evaluate(() => window.api.still('forward-fold', { size: 700, pose: 'stand', view: { azimuth: 0, elevation: 4 } }));
writeFileSync('out/_stand.png', Buffer.from(st.split(',')[1], 'base64'));
await b.close();
const { execFileSync } = await import('node:child_process');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', 'out/_rest.png', '-i', 'out/_stand.png', '-f', 'lavfi', '-i', 'color=c=0xf5f1ea:s=1400x700', '-filter_complex', '[0][1]hstack[r];[2][r]overlay', '-frames:v', '1', `out/${MODEL}/body.png`]);
