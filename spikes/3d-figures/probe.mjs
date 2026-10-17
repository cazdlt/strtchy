import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = process.cwd();
const b = await chromium.launch(); const p = await b.newPage();
p.on('pageerror', e => console.error(e.message));
await p.route('http://spike.local/**', r => { const f = join(ROOT, new URL(r.request().url()).pathname); existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: extname(f)==='.js'?'text/javascript':extname(f)==='.html'?'text/html':'application/octet-stream' }) : r.fulfill({status:404}); });
await p.goto('http://spike.local/index.html?headless&model=' + (process.env.MODEL ?? 'v2')); await p.waitForFunction(() => window.apiReady);
if (process.argv[4] === 'angles') {
  const fs = await import('node:fs');
  const views = JSON.parse(process.argv[5]);
  const files = [];
  for (const [i, v] of views.entries()) {
    const url = await p.evaluate(([id, pose, view]) => window.api.still(id, { size: 360, pose, view }), [process.argv[2], process.argv[3], { azimuth: v[0], elevation: v[1] }]);
    fs.writeFileSync(`out/_a${i}.png`, Buffer.from(url.split(',')[1], 'base64')); files.push(`out/_a${i}.png`);
  }
  const { execFileSync } = await import('node:child_process');
  execFileSync('ffmpeg', ['-y','-loglevel','error', ...files.flatMap(f => ['-i', f]), '-f','lavfi','-i',`color=c=0xf5f1ea:s=${360*files.length}x360`,
    '-filter_complex', `${files.map((_, i) => `[${i}]`).join('')}hstack=inputs=${files.length}[r];[${files.length}][r]overlay`, '-frames:v','1','out/angles.png']);
  await b.close(); process.exit(0);
}
if (process.argv[4] === 'skel') {
  const url = await p.evaluate(([id, pose]) => window.api.still(id, { size: 600, pose, view: { azimuth: 90, elevation: 3 }, skeleton: true }), process.argv.slice(2));
  (await import('node:fs')).writeFileSync('out/skel.png', Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); process.exit(0);
}
console.log(await p.evaluate(async ([mid, pose]) => {
  const { loadFigure, applyPose } = await import('./src/rig.js');
  const { MOVEMENTS } = await import('./src/poses.js');
  const fig = await loadFigure(`./models/${new URLSearchParams(location.search).get("model")}.glb`);
  const m = MOVEMENTS.find(x => x.id === mid);
  applyPose(fig, m.poses[pose]);
  const out = {};
  for (const n of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'])
    out[n] = fig.bones[n].getWorldPosition(new fig.bones[n].position.constructor()).toArray().map(x => +x.toFixed(3)).join(', ');
  return JSON.stringify(out, null, 1);
}, process.argv.slice(2)));
await b.close();
