import { nanoid } from 'nanoid';
import { db } from '../db';
import * as schema from '../db/schema';
import type { movements, routines, routineMovements } from '../db/schema';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const assetsPath = join(process.cwd(), 'src/lib/assets/movements');
const files = readdirSync(assetsPath).filter(f => /\.(svg|jpg|jpeg|png|webp)$/i.test(f));

const svgMap: Record<string, string> = {};
for (const file of files) {
	const fileName = file.split('.')[0];
	const camelCase = fileName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
	const ext = file.split('.').pop()?.toLowerCase();
	if (ext === 'svg') {
		svgMap[camelCase] = readFileSync(join(assetsPath, file), 'utf-8');
	} else {
		svgMap[camelCase] = `/lib/assets/movements/${file}`;
	}
}

const svgs = svgMap as {
	shoulderRolls: string;
	armCircles: string;
	crossBodyStretch: string;
	ninetyNinetyHipSwitch: string;
	butterflyStretch: string;
	pigeonPose: string;
	catCow: string;
	childsPose: string;
	cobraStretch: string;
	downwardDog: string;
	forwardFold: string;
	doorwayPecStretch: string;
	latStretch: string;
	forearmStretch: string;
	quadStretch: string;
	calfStretch: string;
	hamstringStretch: string;
	itBandStretch: string;
	neckSideStretch: string;
	upperTrapStretch: string;
	scapularWallSlides: string;
	facePulls: string;
	internalRotation: string;
	externalRotation: string;
	couchStretch: string;
	hipFlexorLunge: string;
	bandedAnkleDistraction: string;
	thoracicExtension: string;
};

// Helper to create movement objects
const createMovement = (
	name: string,
	description: string,
	type: 'timed' | 'reps' | 'count' | 'distance',
	illustrationPath: string,
	defaultTarget: { type: 'time' | 'reps' | 'distance'; value: number; unit?: string }
): typeof movements.$inferInsert => ({
	id: nanoid(),
	name,
	description,
	type,
	illustrationPath,
	isCustom: false,
	metadata: { defaultTarget },
	createdAt: new Date()
});

// Built-in movements
export const builtInMovements: typeof movements.$inferInsert[] = [
	// Existing
	createMovement('Shoulder Rolls', 'Roll shoulders backward and forward to release tension.', 'timed', svgs.shoulderRolls, { type: 'time', value: 30, unit: 's' }),
	createMovement('Arm Circles', 'Make large circles with both arms simultaneously.', 'timed', svgs.armCircles, { type: 'time', value: 30, unit: 's' }),
	createMovement('Cross Body Stretch', 'Pull arm across chest to stretch the shoulder.', 'timed', svgs.crossBodyStretch, { type: 'time', value: 30, unit: 's' }),
	createMovement('90/90 Hip Switch', 'Switch between two seated positions to open hips.', 'reps', svgs.ninetyNinetyHipSwitch, { type: 'reps', value: 10 }),
	createMovement('Butterfly Stretch', 'Sit with soles together and press knees down.', 'timed', svgs.butterflyStretch, { type: 'time', value: 45, unit: 's' }),
	createMovement('Pigeon Pose', 'Deep hip stretch on one side, then switch.', 'timed', svgs.pigeonPose, { type: 'time', value: 60, unit: 's' }),
	createMovement('Cat-Cow', 'Alternate between arching and rounding the spine.', 'reps', svgs.catCow, { type: 'reps', value: 10 }),
	createMovement('Child\'s Pose', 'Rest back on heels with arms extended forward.', 'timed', svgs.childsPose, { type: 'time', value: 60, unit: 's' }),
	createMovement('Cobra Stretch', 'Lift chest while keeping hips on ground.', 'timed', svgs.cobraStretch, { type: 'time', value: 45, unit: 's' }),
	createMovement('Downward Dog', 'Classic yoga pose for full body stretch.', 'timed', svgs.downwardDog, { type: 'time', value: 30, unit: 's' }),
	createMovement('Forward Fold', 'Hang from hips to stretch hamstrings and back.', 'timed', svgs.forwardFold, { type: 'time', value: 30, unit: 's' }),

	// New for Gym Recovery
	createMovement('Doorway Pec Stretch', 'Stretch chest by placing forearms on a doorway and leaning forward.', 'timed', svgs.doorwayPecStretch, { type: 'time', value: 45, unit: 's' }),
	createMovement('Standing Lat Stretch', 'Reach one arm over head and lean to the opposite side.', 'timed', svgs.latStretch, { type: 'time', value: 30, unit: 's' }),
	createMovement('Forearm Stretch', 'Extend arm forward, palm up/down, and pull fingers back.', 'timed', svgs.forearmStretch, { type: 'time', value: 30, unit: 's' }),
	createMovement('Standing Quad Stretch', 'Hold one foot behind you while standing on the other leg.', 'timed', svgs.quadStretch, { type: 'time', value: 45, unit: 's' }),
	createMovement('Wall Calf Stretch', 'Press hands against wall and lean forward with one heel back.', 'timed', svgs.calfStretch, { type: 'time', value: 45, unit: 's' }),
	createMovement('Standing Hamstring Stretch', 'Place one heel on a raised surface and lean forward from hips.', 'timed', svgs.hamstringStretch, { type: 'time', value: 45, unit: 's' }),

	// New for Running/Biking
	createMovement('IT Band Stretch', 'Cross one leg behind the other and lean away from the back leg.', 'timed', svgs.itBandStretch, { type: 'time', value: 30, unit: 's' }),
	createMovement('Neck Side Stretch', 'Gently pull head toward one shoulder.', 'timed', svgs.neckSideStretch, { type: 'time', value: 20, unit: 's' }),
	createMovement('Upper Trap Stretch', 'Gently pull head forward and to the side.', 'timed', svgs.upperTrapStretch, { type: 'time', value: 20, unit: 's' }),

	// New for Specifics (Shoulder/Hip/Ankle)
	createMovement('Scapular Wall Slides', 'Slide arms up and down a wall while keeping contact.', 'reps', svgs.scapularWallSlides, { type: 'reps', value: 12 }),
	createMovement('Banded Face Pulls', 'Pull a resistance band toward your face, focusing on back of shoulders.', 'reps', svgs.facePulls, { type: 'reps', value: 15 }),
	createMovement('Sleeper Stretch', 'Lie on side, arm at 90 deg, gently push hand toward floor (Internal Rotation).', 'timed', svgs.internalRotation, { type: 'time', value: 30, unit: 's' }),
	createMovement('Banded External Rotation', 'Rotate arm outward against a band while keeping elbow at side.', 'reps', svgs.externalRotation, { type: 'reps', value: 15 }),
	createMovement('Couch Stretch', 'Deep hip flexor stretch with back foot against a wall or couch.', 'timed', svgs.couchStretch, { type: 'time', value: 60, unit: 's' }),
	createMovement('Hip Flexor Lunge', 'Kneeling lunge, tucking pelvis and leaning forward slightly.', 'timed', svgs.hipFlexorLunge, { type: 'time', value: 45, unit: 's' }),
	createMovement('Banded Ankle Distraction', 'Place band around ankle, step forward, and lean weight on knee.', 'timed', svgs.bandedAnkleDistraction, { type: 'time', value: 60, unit: 's' }),
	createMovement('Thoracic Extension', 'Extend upper back over a foam roller or chair back.', 'reps', svgs.thoracicExtension, { type: 'reps', value: 10 })
];

// Helper to find movement by name
const findMovementId = (name: string) => builtInMovements.find(m => m.name === name)?.id || '';

// Built-in routines
export const builtInRoutines: typeof routines.$inferInsert[] = [
	{
		id: nanoid(),
		name: 'Upper Body Gym Recovery',
		description: 'Perfect after a heavy push or pull day. Focuses on chest, lats, and forearms.',
		restBetweenMovements: 15,
		restBetweenSets: 10,
		autoAdvance: true,
		audioEnabled: true,
		keepAwake: true,
		isCustom: false,
		createdAt: new Date()
	},
	{
		id: nanoid(),
		name: 'Lower Body Gym Recovery',
		description: 'Relieve tension in quads, glutes, and calves after leg day.',
		restBetweenMovements: 15,
		restBetweenSets: 10,
		autoAdvance: true,
		audioEnabled: true,
		keepAwake: true,
		isCustom: false,
		createdAt: new Date()
	},
	{
		id: nanoid(),
		name: 'Runner\'s Reset',
		description: 'Twice-weekly routine for runners. Focuses on hamstrings, IT band, and hip flexors.',
		restBetweenMovements: 15,
		restBetweenSets: 15,
		autoAdvance: true,
		audioEnabled: true,
		keepAwake: true,
		isCustom: false,
		createdAt: new Date()
	},
	{
		id: nanoid(),
		name: 'Cyclist\'s Recovery',
		description: 'Sunday special. Focuses on neck, upper traps, and hip flexors to counter the hunched position.',
		restBetweenMovements: 15,
		restBetweenSets: 10,
		autoAdvance: true,
		audioEnabled: true,
		keepAwake: true,
		isCustom: false,
		createdAt: new Date()
	},
	{
		id: nanoid(),
		name: 'Shoulder Health (Impingement & Scapula)',
		description: 'Corrective exercises for impingement and winged scapula. Focus on stability and rotation.',
		restBetweenMovements: 20,
		restBetweenSets: 15,
		autoAdvance: false, // Manual for corrective work
		audioEnabled: true,
		keepAwake: true,
		isCustom: false,
		createdAt: new Date()
	},
	{
		id: nanoid(),
		name: 'Hip & Ankle Mobility',
		description: 'Deep work for tight hip flexors and limited ankle rotation.',
		restBetweenMovements: 20,
		restBetweenSets: 15,
		autoAdvance: true,
		audioEnabled: true,
		keepAwake: true,
		isCustom: false,
		createdAt: new Date()
	}
];

// Routine movements (mappings)
export const builtInRoutineMovements: Record<string, typeof routineMovements.$inferInsert[]> = {
	// Upper Body Gym Recovery
	[builtInRoutines[0].id]: [
		{ id: nanoid(), routineId: builtInRoutines[0].id, movementId: findMovementId('Doorway Pec Stretch'), order: 1, target: { type: 'time', value: 45, unit: 's' }, sets: 2, notes: 'One side at a time' },
		{ id: nanoid(), routineId: builtInRoutines[0].id, movementId: findMovementId('Standing Lat Stretch'), order: 2, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Hold and breathe' },
		{ id: nanoid(), routineId: builtInRoutines[0].id, movementId: findMovementId('Cross Body Stretch'), order: 3, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Shoulder capsule stretch' },
		{ id: nanoid(), routineId: builtInRoutines[0].id, movementId: findMovementId('Forearm Stretch'), order: 4, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Both palm up and down' },
		{ id: nanoid(), routineId: builtInRoutines[0].id, movementId: findMovementId('Thoracic Extension'), order: 5, target: { type: 'reps', value: 10 }, sets: 2, notes: 'Open up the chest' }
	],

	// Lower Body Gym Recovery
	[builtInRoutines[1].id]: [
		{ id: nanoid(), routineId: builtInRoutines[1].id, movementId: findMovementId('Standing Quad Stretch'), order: 1, target: { type: 'time', value: 45, unit: 's' }, sets: 2, notes: 'Keep knees together' },
		{ id: nanoid(), routineId: builtInRoutines[1].id, movementId: findMovementId('Pigeon Pose'), order: 2, target: { type: 'time', value: 60, unit: 's' }, sets: 2, notes: 'Deep glute stretch' },
		{ id: nanoid(), routineId: builtInRoutines[1].id, movementId: findMovementId('Wall Calf Stretch'), order: 3, target: { type: 'time', value: 45, unit: 's' }, sets: 2, notes: 'Straight leg for gastrocnemius' },
		{ id: nanoid(), routineId: builtInRoutines[1].id, movementId: findMovementId('Butterfly Stretch'), order: 4, target: { type: 'time', value: 60, unit: 's' }, sets: 1, notes: 'Inner thigh focus' }
	],

	// Runner's Reset
	[builtInRoutines[2].id]: [
		{ id: nanoid(), routineId: builtInRoutines[2].id, movementId: findMovementId('Standing Hamstring Stretch'), order: 1, target: { type: 'time', value: 45, unit: 's' }, sets: 2, notes: 'Keep back straight' },
		{ id: nanoid(), routineId: builtInRoutines[2].id, movementId: findMovementId('IT Band Stretch'), order: 2, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Lean into the back leg' },
		{ id: nanoid(), routineId: builtInRoutines[2].id, movementId: findMovementId('Hip Flexor Lunge'), order: 3, target: { type: 'time', value: 45, unit: 's' }, sets: 2, notes: 'Tuck pelvis' },
		{ id: nanoid(), routineId: builtInRoutines[2].id, movementId: findMovementId('Wall Calf Stretch'), order: 4, target: { type: 'time', value: 45, unit: 's' }, sets: 2, notes: 'Crucial for runners' },
		{ id: nanoid(), routineId: builtInRoutines[2].id, movementId: findMovementId('Downward Dog'), order: 5, target: { type: 'time', value: 45, unit: 's' }, sets: 1, notes: 'Whole posterior chain' }
	],

	// Cyclist's Recovery
	[builtInRoutines[3].id]: [
		{ id: nanoid(), routineId: builtInRoutines[3].id, movementId: findMovementId('Couch Stretch'), order: 1, target: { type: 'time', value: 60, unit: 's' }, sets: 2, notes: 'The ultimate hip opener' },
		{ id: nanoid(), routineId: builtInRoutines[3].id, movementId: findMovementId('Neck Side Stretch'), order: 2, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Counter "aero" position' },
		{ id: nanoid(), routineId: builtInRoutines[3].id, movementId: findMovementId('Upper Trap Stretch'), order: 3, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Release tension' },
		{ id: nanoid(), routineId: builtInRoutines[3].id, movementId: findMovementId('Cat-Cow'), order: 4, target: { type: 'reps', value: 12 }, sets: 2, notes: 'Move the spine' },
		{ id: nanoid(), routineId: builtInRoutines[3].id, movementId: findMovementId('Doorway Pec Stretch'), order: 5, target: { type: 'time', value: 45, unit: 's' }, sets: 1, notes: 'Open up the chest' }
	],

	// Shoulder Health
	[builtInRoutines[4].id]: [
		{ id: nanoid(), routineId: builtInRoutines[4].id, movementId: findMovementId('Scapular Wall Slides'), order: 1, target: { type: 'reps', value: 12 }, sets: 3, notes: 'Focus on scapular control' },
		{ id: nanoid(), routineId: builtInRoutines[4].id, movementId: findMovementId('Banded Face Pulls'), order: 2, target: { type: 'reps', value: 15 }, sets: 3, notes: 'External rotation at the end' },
		{ id: nanoid(), routineId: builtInRoutines[4].id, movementId: findMovementId('Sleeper Stretch'), order: 3, target: { type: 'time', value: 30, unit: 's' }, sets: 2, notes: 'Gently for internal rotation' },
		{ id: nanoid(), routineId: builtInRoutines[4].id, movementId: findMovementId('Banded External Rotation'), order: 4, target: { type: 'reps', value: 15 }, sets: 3, notes: 'Stability focus' }
	],

	// Hip & Ankle Mobility
	[builtInRoutines[5].id]: [
		{ id: nanoid(), routineId: builtInRoutines[5].id, movementId: findMovementId('90/90 Hip Switch'), order: 1, target: { type: 'reps', value: 12 }, sets: 2, notes: 'Focus on rotation' },
		{ id: nanoid(), routineId: builtInRoutines[5].id, movementId: findMovementId('Couch Stretch'), order: 2, target: { type: 'time', value: 60, unit: 's' }, sets: 2, notes: 'For tight hip flexors' },
		{ id: nanoid(), routineId: builtInRoutines[5].id, movementId: findMovementId('Banded Ankle Distraction'), order: 3, target: { type: 'time', value: 60, unit: 's' }, sets: 2, notes: 'Increase dorsiflexion' },
		{ id: nanoid(), routineId: builtInRoutines[5].id, movementId: findMovementId('Pigeon Pose'), order: 4, target: { type: 'time', value: 60, unit: 's' }, sets: 2, notes: 'Glute and hip mobility' }
	]
};

export async function seedDatabase() {
	try {
		console.log('Starting database seed...');
		
		// Insert movements
		for (const movement of builtInMovements) {
			await db.insert(schema.movements).values(movement).onConflictDoNothing();
		}
		console.log(`✓ Seeded ${builtInMovements.length} movements`);
		
		// Insert routines
		for (const routine of builtInRoutines) {
			await db.insert(schema.routines).values(routine).onConflictDoNothing();
		}
		console.log(`✓ Seeded ${builtInRoutines.length} routines`);
		
		// Insert routine movements
		for (const [routineId, movements] of Object.entries(builtInRoutineMovements)) {
			for (const rm of movements) {
				await db.insert(schema.routineMovements).values(rm).onConflictDoNothing();
			}
		}
		console.log('✓ Seeded routine movements');
		
		console.log('Database seed completed successfully!');
	} catch (error) {
		console.error('Error seeding database:', error);
		throw error;
	}
}
