import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputDir = path.resolve('static/audio/cues');
fs.mkdirSync(outputDir, { recursive: true });

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

// 1. General Workout Cues
const generalCues = [
  { slug: 'get-ready', phrase: 'Get ready' },
  { slug: 'switch-sides', phrase: 'Switch sides' },
  { slug: 'rest', phrase: 'Rest' },
  { slug: 'halfway', phrase: 'Halfway' },
  { slug: 'practice-complete', phrase: 'Practice complete' },
  { slug: 'next-up', phrase: 'Next up' },
];

// 2. Default Seed Movements
const seedData = JSON.parse(fs.readFileSync('src/lib/seed/data.json', 'utf8'));
const movementCues = seedData.movements.map((m) => ({
  slug: slugify(m.name),
  phrase: m.name,
}));

const allCues = [...generalCues, ...movementCues];

console.log(`Generating ${allCues.length} audio cues...`);

let successCount = 0;
for (const cue of allCues) {
  const mp3Path = path.join(outputDir, `${cue.slug}.mp3`);
  const aiffPath = `/tmp/cue_${cue.slug}.aiff`;

  try {
    // Generate AIFF with macOS say
    execSync(`say -v Samantha -r 170 "${cue.phrase}" -o "${aiffPath}"`, { stdio: 'ignore' });
    // Normalize to standard broadcast loudness (-19 LUFS) via ffmpeg loudnorm
    execSync(
      `ffmpeg -y -i "${aiffPath}" -af "loudnorm=I=-19:TP=-1.5:LRA=7" -codec:a libmp3lame -b:a 64k -ac 1 "${mp3Path}"`,
      { stdio: 'ignore' }
    );
    if (fs.existsSync(aiffPath)) fs.unlinkSync(aiffPath);
    successCount++;
  } catch (err) {
    console.error(`Failed to generate ${cue.slug}:`, err.message);
  }
}

console.log(`Successfully generated ${successCount} of ${allCues.length} audio cues in static/audio/cues/`);
