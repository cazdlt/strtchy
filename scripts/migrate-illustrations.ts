import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data/dev/local.db');
const db = new Database(dbPath);

const updateStatements = [
	['Shoulder Rolls', '/assets/movements/shoulder-rolls.svg'],
	['Arm Circles', '/assets/movements/arm-circles.svg'],
	['Cross Body Stretch', '/assets/movements/cross-body-stretch.svg'],
	['90/90 Hip Switch', '/assets/movements/ninety-ninety-hip-switch.svg'],
	['Butterfly Stretch', '/assets/movements/butterfly-stretch.svg'],
	['Pigeon Pose', '/assets/movements/pigeon-pose.svg'],
	['Cat-Cow', '/assets/movements/cat-cow.svg'],
	["Child's Pose", '/assets/movements/childs-pose.svg'],
	['Cobra Stretch', '/assets/movements/cobra-stretch.svg'],
	['Downward Dog', '/assets/movements/downward-dog.svg'],
	['Forward Fold', '/assets/movements/forward-fold.svg'],
	['Doorway Pec Stretch', '/assets/movements/doorway-pec-stretch.svg'],
	['Standing Lat Stretch', '/assets/movements/lat-stretch.svg'],
	['Forearm Stretch', '/assets/movements/forearm-stretch.svg'],
	['Standing Quad Stretch', '/assets/movements/quad-stretch.svg'],
	['Wall Calf Stretch', '/assets/movements/calf-stretch.svg'],
	['Standing Hamstring Stretch', '/assets/movements/hamstring-stretch.svg'],
	['IT Band Stretch', '/assets/movements/it-band-stretch.svg'],
	['Neck Side Stretch', '/assets/movements/neck-side-stretch.svg'],
	['Upper Trap Stretch', '/assets/movements/upper-trap-stretch.svg'],
	['Scapular Wall Slides', '/assets/movements/scapular-wall-slides.svg'],
	['Banded Face Pulls', '/assets/movements/face-pulls.svg'],
	['Sleeper Stretch', '/assets/movements/internal-rotation.svg'],
	['Banded External Rotation', '/assets/movements/external-rotation.svg'],
	['Couch Stretch', '/assets/movements/couch-stretch.svg'],
	['Hip Flexor Lunge', '/assets/movements/hip-flexor-lunge.svg'],
	['Banded Ankle Distraction', '/assets/movements/banded-ankle-distraction.svg'],
	['Thoracic Extension', '/assets/movements/thoracic-extension.svg']
];

const update = db.prepare('UPDATE movements SET illustration_path = ? WHERE name = ?');

for (const [name, path] of updateStatements) {
	update.run(path, name);
	console.log(`Updated: ${name} -> ${path}`);
}

console.log('Database migration complete!');
