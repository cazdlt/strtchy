// Movement group: prone. See core.js for the pose format and shared building blocks.
// eslint-disable-next-line no-unused-vars
import { ARMS_DOWN, LEGS_STRAIGHT, STAND, QUAD_HIP_Y, QUAD_LEGS, QUAD_HANDS, QUAD_WRISTS, QUAD_NEUTRAL, pitch } from './core.js';

const rad = (d) => (d * Math.PI) / 180;
const r3 = (a) => a.map((x) => +x.toFixed(3));
/** Unit vector along the body, rising `deg` toward +z (the head end). */
const up = (deg) => r3([0, Math.sin(rad(deg)), Math.cos(rad(deg))]);
/** Same line pointing toward the feet (thighs, shins). */
const down = (deg) => r3([0, -Math.sin(rad(deg)), -Math.cos(rad(deg))]);
/** Front of a prone body segment rising `deg`: down, tilted toward the head. */
const belly = (deg) => r3([0, -Math.cos(rad(deg)), Math.sin(rad(deg))]);

// ----------------------------------------------------------------- cobra

// Prone legs: long behind, kneecaps and tops of the feet down.
const PRONE_LEGS = {
	// The thigh is thick at the hip and thin at the knee: angle it down so the
	// whole front of the leg lies on the floor.
	LeftUpLeg: { dir: [0.04, -0.2, -1], face: [0, -1, 0] },
	RightUpLeg: { dir: [-0.04, -0.2, -1], face: [0, -1, 0] },
	LeftLeg: { dir: [0, 0, -1], face: [0, -1, 0] },
	RightLeg: { dir: [0, 0, -1], face: [0, -1, 0] },
	LeftFoot: { dir: [0, -0.03, -1], face: [0, -1, 0.03] },
	RightFoot: { dir: [0, -0.03, -1], face: [0, -1, 0.03] }
};
const PALMS_FWD = {
	LeftHand: { dir: [0.05, 0.1, 1], face: [-1, 0, 0] },
	RightHand: { dir: [-0.05, 0.1, 1], face: [1, 0, 0] }
};

const PRONE_FLAT = {
	hips: { pos: [0, 0.12, 0], dir: [0, 0.02, 1], face: [0, -1, 0.02] },
	bones: {
		Spine: [0, 0.03, 1],
		Spine1: [0, 0.03, 1],
		Spine2: [0, 0.02, 1],
		Neck: [0, 0.05, 1],
		Head: { dir: [0, 0.05, 1], face: [0, -1, 0.05] },
		LeftShoulder: { dir: [1, 0, 0], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, 0, 0], face: [0, 1, 0] },
		...PALMS_FWD,
		...PRONE_LEGS
	},
	ik: {
		LeftHand: { target: [0.05, 0.05, -0.05], under: true, pole: [0.1, 0.6, -1] },
		RightHand: { target: [-0.05, 0.05, -0.05], under: true, pole: [-0.1, 0.6, -1] }
	}
};

const COBRA = {
	hips: { pos: [0, 0.12, 0], dir: up(6), face: belly(6) },
	bones: {
		...PRONE_FLAT.bones,
		Spine: up(17),
		Spine1: up(34),
		Spine2: up(48),
		Neck: up(54),
		Head: { dir: up(40), face: [0, -0.35, 1] },
		// Shoulders down and back, away from the ears.
		LeftShoulder: { dir: [1, -0.1, -0.15], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, -0.1, -0.15], face: [0, 1, 0] }
	},
	ik: {
		LeftHand: { target: [0.06, 0.05, -0.05], under: true, pole: [0.2, 0.1, -1] },
		RightHand: { target: [-0.06, 0.05, -0.05], under: true, pole: [-0.2, 0.1, -1] }
	}
};

// ------------------------------------------------------------ front plank

// Forearm plank: elbows under the shoulders, forearms parallel, body one
// straight line from heels to crown, on the balls of the feet.
const PLANK_DEG = 5.3;
const plankBody = (deg, sag = 0) => ({
	hips: { pos: [0, 0.4, 0], dir: up(deg - sag), face: belly(deg - sag) },
	bones: {
		Spine: up(deg + sag * 0.5),
		Spine1: up(deg + sag),
		Spine2: up(deg),
		Neck: up(deg + 4),
		Head: { dir: up(deg + 6), face: [0, -1, 0.25] },
		LeftShoulder: { dir: [1, -0.05, 0.05], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, -0.05, 0.05], face: [0, 1, 0] },
		LeftArm: { dir: [0.02, -1, 0.04], face: [0, 0, 1] },
		RightArm: { dir: [-0.02, -1, 0.04], face: [0, 0, 1] },
		LeftForeArm: { dir: [-0.04, -0.02, 1], face: [-1, 0, 0] },
		RightForeArm: { dir: [0.04, -0.02, 1], face: [1, 0, 0] },
		...PALMS_FWD,
		LeftUpLeg: { dir: [0.02, ...down(deg).slice(1)], face: [0, -1, 0] },
		RightUpLeg: { dir: [-0.02, ...down(deg).slice(1)], face: [0, -1, 0] },
		LeftLeg: { dir: down(deg), face: [0, -1, 0] },
		RightLeg: { dir: down(deg), face: [0, -1, 0] },
		// On the balls of the feet: foot vertical, top of the foot toward the head.
		LeftFoot: { dir: [0, -1, 0.15], face: [0, 0, 1] },
		RightFoot: { dir: [0, -1, 0.15], face: [0, 0, 1] },
		LeftToeBase: { dir: [0, -0.1, -1], face: [0, 1, 0] },
		RightToeBase: { dir: [0, -0.1, -1], face: [0, 1, 0] }
	}
});

// --------------------------------------------------------------- side plank

// Lying on the left side, head toward +z, front of the body toward -x.
// Every spine/neck bone MUST carry `face: [-1, 0, 0]` (omitting `face` makes
// `orient()` default to facing -Y, twisting the ribcage 90deg against the hips).
const sideVec = (deg, [x, y, z]) => {
	const s = Math.sin(rad(deg)), c = Math.cos(rad(deg));
	return r3([-z, -x * c + y * s, x * s + y * c]);
};
const sideBone = (deg, dir, face = [0, 0, 1]) => ({
	dir: sideVec(deg, dir),
	face: sideVec(deg, face)
});

const sidePlank = (torsoDeg, legDeg, reach = 1) => ({
	hips: { pos: [0, 0.36, 0], ...sideBone((torsoDeg + legDeg) * 0.5, [0, 1, 0]) },
	bones: {
		Spine: sideBone(torsoDeg - 2, [0, 1, 0]),
		Spine1: sideBone(torsoDeg, [0, 1, 0]),
		Spine2: sideBone(torsoDeg + 2, [0, 1, 0]),
		Neck: sideBone(torsoDeg + 1, [0, 1, 0.08]),
		Head: sideBone(torsoDeg + 1, [0, 1, 0.10]),
		// Depress both clavicles (matching A-pose rest y = -0.38) so the supporting
		// shoulder pushes the floor away instead of hunching into the neck.
		LeftShoulder: sideBone(torsoDeg, [0.92, -0.36, 0.04]),
		RightShoulder: sideBone(torsoDeg, [-0.92, -0.25 + reach * 0.15, 0]),
		LeftArm: { dir: [0.02, -1, 0.06], face: [-1, 0, 0] },
		LeftForeArm: { dir: [-0.92, 0.02, 0.38], face: [0.38, 0, 0.92] },
		LeftHand: { dir: [-0.92, 0.10, 0.38], face: [0.38, 0, 0.92] },
		RightArm: reach
			? { dir: [-0.04, 1, 0.04], face: [-1, 0, 0] }
			: sideBone(torsoDeg, [-0.16, -0.95, 0.10]),
		RightForeArm: reach
			? { dir: [-0.02, 1, 0.04], face: [-1, 0, 0] }
			: sideBone(torsoDeg, [0.02, -0.95, 0.18]),
		RightHand: reach
			? { dir: [0, 1, 0.04], face: [0, 0, 1] }
			: sideBone(torsoDeg, [0.05, -0.95, 0.12], [1, 0, 0]),
		// Bottom leg reaches the floor; top leg converges onto the bottom foot.
		LeftUpLeg: sideBone(legDeg, [0, -1, 0]),
		RightUpLeg: sideBone(legDeg + 5, [0, -1, 0]),
		LeftLeg: sideBone(legDeg, [0, -1, -0.02]),
		RightLeg: sideBone(legDeg + 4, [0, -1, -0.02]),
		LeftFoot: sideBone(legDeg, [0.05, -0.55, 1], [0, 1, 0.5]),
		RightFoot: sideBone(legDeg + 4, [-0.05, -0.55, 1], [0, 1, 0.5])
	}
});

// ------------------------------------------------------------ quad release

// On the forearms, the roller across the floor under the thighs. The body
// slides over the roller (forearms slide with it) from hip to knee.
const ROLLER_Z = -0.25;
const quadRelease = (hipZ, deg, bend = 0) => ({
	hips: { pos: [0, 0.3, hipZ], dir: up(deg), face: belly(deg) },
	bones: {
		...plankBody(deg).bones,
		Neck: up(deg + 8),
		Head: { dir: up(deg + 14), face: [0, -1, 0.4] },
		LeftUpLeg: { dir: [0.04, ...down(deg).slice(1)], face: [0, -1, 0] },
		RightUpLeg: { dir: [-0.04, ...down(deg).slice(1)], face: [0, -1, 0] },
		LeftLeg: { dir: r3([0, Math.sin(rad(bend)) - 0.12, -Math.cos(rad(bend))]), face: [0, -1, 0] },
		RightLeg: { dir: [0, -0.12, -1], face: [0, -1, 0] },
		LeftFoot: { dir: r3([0, Math.sin(rad(bend)) - 0.3, -Math.cos(rad(bend))]), face: [0, -1, 0.3] },
		RightFoot: { dir: [0, -0.3, -1], face: [0, -1, 0.3] }
	}
});

// ----------------------------------------------------------- downward dog

// Inverted V: arms in line with a long spine, hips high, heels reaching down.
// Arms are explicit (they ground the pose); the feet reach the floor by IK,
// so the knees soften as needed on longer-legged bodies.
// Hips sit back so the hands land where they were on all fours (only the feet travel).
const DOG_Z = -0.28;
const DOG = {
	hips: { pos: [0, 0.8, DOG_Z], dir: [0, -0.75, 1], face: [0, -1, -0.75] },
	bones: {
		Spine: { dir: [0, -0.85, 1], face: [0, -1, -0.85] },
		Spine1: { dir: [0, -0.95, 1], face: [0, -1, -0.95] },
		Spine2: { dir: [0, -1, 1], face: [0, -1, -1] },
		Neck: [0, -1, 0.9],
		Head: { dir: [0, -1, 0.8], face: [0, -0.8, -1] },
		LeftShoulder: { dir: [1, -0.1, 0.25], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, -0.1, 0.25], face: [0, 1, 0] },
		LeftArm: { dir: [0.12, -0.85, 1], face: [-0.6, 0.6, 0.5] },
		RightArm: { dir: [-0.12, -0.85, 1], face: [0.6, 0.6, 0.5] },
		LeftForeArm: { dir: [0.05, -0.9, 1], face: [-1, 0, 0] },
		RightForeArm: { dir: [-0.05, -0.9, 1], face: [1, 0, 0] },
		...PALMS_FWD,
		LeftFoot: { dir: [0, -0.6, 1], face: [0, 1, 0.6] },
		RightFoot: { dir: [0, -0.6, 1], face: [0, 1, 0.6] }
	},
	ik: {
		LeftFoot: { target: [0.1, 0.1, DOG_Z - 0.47], pole: [0, 0, 1] },
		RightFoot: { target: [-0.1, 0.1, DOG_Z - 0.47], pole: [0, 0, 1] }
	}
};
// The all-fours start uses the same IK ends (feet) and explicit arms: an IK end
// present in only one of two poses snaps at the start or end of the blend.
const DOG_QUAD = {
	...QUAD_NEUTRAL,
	bones: {
		...QUAD_NEUTRAL.bones,
		LeftArm: { dir: [0, -1, -0.04], face: [0, 0, 1] },
		RightArm: { dir: [0, -1, -0.04], face: [0, 0, 1] },
		LeftForeArm: { dir: [0, -1, 0.04], face: [-1, 0, 0] },
		RightForeArm: { dir: [0, -1, 0.04], face: [1, 0, 0] },
		...PALMS_FWD
	},
	ik: {
		LeftFoot: { target: [0.1, 0.09, -0.43], pole: [0, -1, 0.05] },
		RightFoot: { target: [-0.1, 0.09, -0.43], pole: [0, -1, 0.05] }
	}
};

// ------------------------------------------------------- wrist rocks

// Hands stay planted while the shoulders travel past the wrists and back.
// `under` hand targets move with the pelvis, so offset them by -shift.
const rock = (shift, thighTilt) => ({
	hips: { ...QUAD_NEUTRAL.hips, pos: [0, QUAD_HIP_Y, shift] },
	bones: {
		...QUAD_NEUTRAL.bones,
		LeftUpLeg: { dir: [0.02, -1, thighTilt], face: [0, 0, 1] },
		RightUpLeg: { dir: [-0.02, -1, thighTilt], face: [0, 0, 1] }
	},
	ik: {
		LeftHand: { ...QUAD_HANDS.LeftHand, target: [0, 0.07, 0.03 - shift] },
		RightHand: { ...QUAD_HANDS.RightHand, target: [0, 0.07, 0.03 - shift] }
	}
});

// ---------------------------------------------------- thread the needle

// Left arm slides under the chest to the right, palm up; left shoulder and
// the side of the head come to rest on the floor; the hips stay over the knees.
const THREAD = {
	hips: { pos: [0, QUAD_HIP_Y, 0], dir: pitch(-12), face: [-0.08, -1, -0.2] },
	bones: {
		...QUAD_NEUTRAL.bones,
		Spine: { dir: pitch(-28), face: [-0.35, -1, 0] },
		Spine1: { dir: pitch(-42), face: [-0.9, -1, 0] },
		Spine2: { dir: pitch(-48), face: [-1.6, -1, 0] },
		Neck: { dir: [0.05, -0.45, 1], face: [-2, -1, 0] },
		Head: { dir: [0.14, -0.32, 1], face: [-1, -0.2, 0] },
		LeftShoulder: { dir: [0.4, -1, 0.3], face: [0, 1, 0] },
		RightShoulder: { dir: [-0.6, 0.8, 0.05], face: [0, 1, 0] },
		LeftHand: { dir: [-1, 0, 0.1], face: [0, 0, 1] },
		RightHand: { dir: [-0.05, 0, 1], face: [1, 0, 0] }
	},
	ik: {
		LeftHand: { target: [-0.42, 0.04, 0.42], pole: [0, 1, 0.3] },
		RightHand: { target: [-0.2, 0.07, 0.56], pole: [-0.6, 1, -0.4] }
	}
};
const THREAD_START = {
	...QUAD_NEUTRAL,
	ik: {
		LeftHand: { target: [0.14, 0.07, 0.42], pole: [0, 0, -1] },
		RightHand: { target: [-0.14, 0.07, 0.42], pole: [0, 0, -1] }
	}
};

const MAT = (z = 0) => ({ kind: 'mat', pos: [0, 0, z] });

export const MOVEMENTS = [
	{
		id: 'cobra-extension',
		name: 'Cobra Extension',
		seed: 'Cobra Extension',
		view: { azimuth: 80, elevation: 12 },
		icon: 'cobra',
		props: [MAT(-0.22)],
		poses: { flat: PRONE_FLAT, cobra: COBRA },
		timeline: [
			{ pose: 'flat', hold: 1.0, in: 2.2 },
			{ pose: 'cobra', in: 2.4, hold: 2.0 }
		]
	},
	{
		id: 'quad-release',
		name: 'Quad Release',
		seed: 'Quad Release',
		bilateral: true,
		view: { azimuth: 75, elevation: 14 },
		icon: 'hip',
		props: [MAT(-0.1), { kind: "roller", pos: [0, 0.075, ROLLER_Z] }],
		poses: { hip: quadRelease(ROLLER_Z + 0.12, 4), knee: quadRelease(ROLLER_Z + 0.32, 4), bend: quadRelease(ROLLER_Z + 0.32, 4, 60) },
		timeline: [
			{ pose: 'hip', hold: 0.6, in: 2.0 },
			{ pose: 'knee', in: 2.0, hold: 0.3 },
			{ pose: 'bend', in: 1.2, hold: 0.8 },
			{ pose: 'knee', in: 1.0, hold: 0.2 }
		]
	},
	{
		id: 'front-plank',
		name: 'Front Plank',
		seed: 'Front Plank',
		view: { azimuth: 80, elevation: 10 },
		icon: 'hold',
		props: [MAT(-0.15)],
		poses: { hold: plankBody(PLANK_DEG), breathe: plankBody(PLANK_DEG + 0.6, 1) },
		timeline: [
			{ pose: 'hold', hold: 1.2, in: 2.0 },
			{ pose: 'breathe', in: 2.0, hold: 1.0 }
		]
	},
	{
		id: 'side-plank',
		name: 'Side Plank',
		seed: 'Side Plank',
		bilateral: true,
		view: { azimuth: -55, elevation: 16 },
		icon: 'hold',
		props: [MAT(-0.15)],
		poses: { low: sidePlank(18, 12, 0), hold: sidePlank(12.5, 16.5, 1) },
		timeline: [
			{ pose: 'low', hold: 0.7, in: 1.8 },
			{ pose: 'hold', in: 1.8, hold: 1.9 }
		]
	},
	{
		id: 'downward-dog',
		name: 'Downward Dog',
		seed: 'Downward Dog',
		view: { azimuth: 82, elevation: 8 },
		icon: 'dog',
		props: [MAT(-0.15)],
		poses: { quad: DOG_QUAD, dog: DOG },
		timeline: [
			{ pose: 'quad', hold: 0.8, in: 2.4 },
			{ pose: 'dog', in: 2.6, hold: 2.2 }
		]
	},
	{
		id: 'quadruped-wrist-rocks',
		name: 'Quadruped Wrist Rocks',
		seed: 'Quadruped Wrist Rocks',
		view: { azimuth: 84, elevation: 10 },
		icon: 'forward',
		props: [MAT(0)],
		poses: { neutral: QUAD_NEUTRAL, forward: rock(0.12, -0.3), back: rock(-0.1, 0.25) },
		timeline: [
			{ pose: 'neutral', hold: 0.3, in: 1.0 },
			{ pose: 'forward', in: 1.6, hold: 0.8 },
			{ pose: 'back', in: 2.2, hold: 0.6 }
		]
	},
	{
		id: 'thread-the-needle',
		name: 'Thread the Needle',
		seed: 'Thread the Needle',
		bilateral: true,
		view: { azimuth: -40, elevation: 25 },
		icon: 'thread',
		props: [MAT(0)],
		poses: { quad: THREAD_START, thread: THREAD },
		timeline: [
			{ pose: 'quad', hold: 0.8, in: 2.4 },
			{ pose: 'thread', in: 2.8, hold: 2.2 }
		]
	}
];
