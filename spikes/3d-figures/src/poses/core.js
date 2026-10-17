// Movement pose data. Directions are world-space: +Y up, +Z = where the figure
// faces, +X = the figure's LEFT. Bones point from joint toward the next joint
// (thigh: hip -> knee). `face` is where the segment's front points (kneecap,
// shin, top of the foot, front of torso). IK targets are wrist/ankle joint
// positions with the floor at y = 0 (the solver re-grounds afterwards).

export const ARMS_DOWN = {
	// Clavicles dropped and arms slightly away from the body: T-pose skinning
	// otherwise bunches the deltoid into a boxy "shoulder pad".
	LeftShoulder: { dir: [1, -0.18, 0], face: [0, 0, 1] },
	RightShoulder: { dir: [-1, -0.18, 0], face: [0, 0, 1] },
	LeftArm: { dir: [0.2, -1, 0], face: [0, 0, 1] },
	RightArm: { dir: [-0.2, -1, 0], face: [0, 0, 1] },
	LeftForeArm: { dir: [0.04, -1, 0.08], face: [0, 0, 1] },
	RightForeArm: { dir: [-0.04, -1, 0.08], face: [0, 0, 1] },
	LeftHand: { dir: [0.02, -1, 0.04], face: [0, 0, 1] },
	RightHand: { dir: [-0.02, -1, 0.04], face: [0, 0, 1] }
};

export const LEGS_STRAIGHT = {
	LeftUpLeg: { dir: [0.04, -1, 0], face: [0, 0, 1] },
	RightUpLeg: { dir: [-0.04, -1, 0], face: [0, 0, 1] },
	LeftLeg: { dir: [0, -1, -0.02], face: [0, 0, 1] },
	RightLeg: { dir: [0, -1, -0.02], face: [0, 0, 1] },
	LeftFoot: { dir: [0.05, -0.55, 1], face: [0, 1, 0.5] },
	RightFoot: { dir: [-0.05, -0.55, 1], face: [0, 1, 0.5] }
};

export const STAND = {
	hips: { pos: [0, 1, 0], dir: [0, 1, 0], face: [0, 0, 1] },
	bones: {
		Spine: [0, 1, 0.02],
		Spine1: [0, 1, 0],
		Spine2: [0, 1, -0.02],
		// Neck/Head omitted: each model keeps its natural rest carriage (forcing
		// them vertical tipped realistic heads chin-up).
		...ARMS_DOWN,
		...LEGS_STRAIGHT
	}
};

// ------------------------------------------------------------- forward fold

// A moderate fold: pelvis hinges ~90deg, soft knees, hands reach the shins.
// The neck stays relaxed with the crown toward the floor. Do NOT tuck the crown
// toward the shins: the face then looks back through the legs (creepy).
const FOLD = {
	hips: { pos: [0, 1, -0.06], dir: [0, -0.05, 1], face: [0, -1, -0.05] },
	bones: {
		...STAND.bones,
		Spine: [0, -0.55, 1],
		Spine1: [0, -0.95, 0.7],
		Spine2: [0, -1, 0.35],
		Neck: [0, -1, 0.25],
		Head: { dir: [0, -1, 0.3], face: [0, -0.3, -1] },
		LeftShoulder: { dir: [1, -0.1, 0.1], face: [0, -1, 0] },
		RightShoulder: { dir: [-1, -0.1, 0.1], face: [0, -1, 0] },
		LeftArm: { dir: [0.04, -1, -0.05], face: [0, 0, 1] },
		RightArm: { dir: [-0.04, -1, -0.05], face: [0, 0, 1] },
		LeftForeArm: { dir: [0, -1, -0.18], face: [0, 0, 1] },
		RightForeArm: { dir: [0, -1, -0.18], face: [0, 0, 1] },
		LeftHand: { dir: [0, -1, -0.1], face: [0, 0, 1] },
		RightHand: { dir: [0, -1, -0.1], face: [0, 0, 1] },
		LeftUpLeg: { dir: [0.04, -1, 0.14], face: [0, 0, 1] },
		RightUpLeg: { dir: [-0.04, -1, 0.14], face: [0, 0, 1] },
		LeftLeg: { dir: [0, -1, -0.06], face: [0, 0, 1] },
		RightLeg: { dir: [0, -1, -0.06], face: [0, 0, 1] }
	}
};

// ------------------------------------------------------------------ cat-cow

// Knee mesh sits ~9cm below the knee joint, so hips = 0.09 + thigh (0.433).
export const QUAD_HIP_Y = 0.52;
export const QUAD_LEGS = {
	LeftUpLeg: { dir: [0.02, -1, 0], face: [0, 0, 1] },
	RightUpLeg: { dir: [-0.02, -1, 0], face: [0, 0, 1] },
	// Shins flat so knees and the tops of the feet share the floor.
	LeftLeg: { dir: [0, 0.12, -1], face: [0, -1, 0] },
	RightLeg: { dir: [0, 0.12, -1], face: [0, -1, 0] },
	LeftFoot: { dir: [0, -0.12, -1], face: [0, -1, 0] },
	RightFoot: { dir: [0, -0.12, -1], face: [0, -1, 0] }
};
export const QUAD_HANDS = {
	// Wrist directly under the shoulder, a palm's thickness above the floor.
	LeftHand: { target: [0, 0.07, 0.03], under: true, pole: [0, 0, -1] },
	RightHand: { target: [0, 0.07, 0.03], under: true, pole: [0, 0, -1] }
};
// Hand 'face' is the thumb side (T-pose rest): thumbs in = palms flat on the floor.
export const QUAD_WRISTS = {
	LeftHand: { dir: [0.05, 0, 1], face: [-1, 0, 0] },
	RightHand: { dir: [-0.05, 0, 1], face: [1, 0, 0] },
	LeftShoulder: { dir: [1, 0, 0.1], face: [0, 1, 0] },
	RightShoulder: { dir: [-1, 0, 0.1], face: [0, 1, 0] }
};

export const QUAD_NEUTRAL = {
	// Spine rises slightly so straight arms reach the floor.
	hips: { pos: [0, QUAD_HIP_Y, 0], dir: [0, 0.15, 1], face: [0, -1, 0.15] },
	bones: {
		Spine: [0, 0.2, 1],
		Spine1: [0, 0.18, 1],
		Spine2: [0, 0.12, 1],
		Neck: [0, 0.1, 1],
		Head: [0, 0.15, 1],
		...QUAD_WRISTS,
		...QUAD_LEGS
	},
	ik: QUAD_HANDS
};

// Cat and cow spread a moderate curve over the whole spine (pitch per segment,
// relative to horizontal) instead of cranking a single joint. The neutral
// back already slopes up ~10deg because v2's arms are long.
export const pitch = (deg) => [0, Math.tan((deg * Math.PI) / 180), 1];

const CAT = {
	// Pelvis tucks, the arc peaks mid-back, crown drops toward the floor.
	hips: { pos: [0, QUAD_HIP_Y, 0], dir: pitch(28), face: [0, -1, 0.53] },
	bones: {
		...QUAD_NEUTRAL.bones,
		Spine: pitch(18),
		Spine1: pitch(6),
		Spine2: pitch(-8),
		Neck: pitch(-28),
		Head: pitch(-42),
		// Shoulder blades spread (protract) as the upper back rounds.
		LeftShoulder: { dir: [1, -0.05, 0.3], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, -0.05, 0.3], face: [0, 1, 0] }
	},
	ik: QUAD_HANDS
};

const COW = {
	// Gentle lumbar sag, chest opens forward, gaze forward-down (not the ceiling).
	hips: { pos: [0, QUAD_HIP_Y, 0], dir: pitch(-4), face: [0, -1, -0.07] },
	bones: {
		...QUAD_NEUTRAL.bones,
		Spine: pitch(2),
		Spine1: pitch(16),
		Spine2: pitch(24),
		Neck: pitch(32),
		Head: pitch(38),
		// Shoulder blades draw together (retract).
		LeftShoulder: { dir: [1, 0.05, -0.12], face: [0, 1, 0] },
		RightShoulder: { dir: [-1, 0.05, -0.12], face: [0, 1, 0] }
	},
	ik: QUAD_HANDS
};

// ----------------------------------------------------------- pigeon (left)

const PIGEON_LEGS = {
	// Front (left) leg: thigh forward, externally rotated, shin across the body.
	LeftUpLeg: { dir: [0.3, -0.2, 1], face: [0.4, 1, 0] },
	LeftLeg: { dir: [-1, 0, -0.2], face: [0, 0.5, 1] },
	LeftFoot: { dir: [-0.35, 0, 1], face: [-1, 0, -0.2] },
	// Back (right) leg: long behind, kneecap and top of foot down.
	RightUpLeg: { dir: [-0.04, -0.22, -1], face: [0, -1, 0.22] },
	RightLeg: { dir: [0, 0.06, -1], face: [0, -1, 0.1] },
	RightFoot: { dir: [0, -0.1, -1], face: [0, -1, 0] }
};

const PIGEON_UP = {
	hips: { pos: [0, 0.26, 0], dir: [0, 1, 0.12], face: [0, -0.12, 1] },
	bones: {
		Spine: [0, 1, 0.12],
		Spine1: [0, 1, 0],
		Spine2: [0, 1, -0.08],
		Neck: [0, 1, 0.1],
		Head: [0, 1, 0.1],
		LeftShoulder: { dir: [1, 0, -0.05], face: [0, 0, 1] },
		RightShoulder: { dir: [-1, 0, -0.05], face: [0, 0, 1] },
		// Fingertips on the floor beside the hips.
		LeftHand: { dir: [0.05, -1, 0.25], face: [0, 0, 1] },
		RightHand: { dir: [-0.05, -1, 0.25], face: [0, 0, 1] },
		...PIGEON_LEGS
	},
	ik: {
		LeftHand: { target: [0.26, 0.13, 0.14], pole: [0.4, 0, -1] },
		RightHand: { target: [-0.26, 0.13, 0.14], pole: [-0.4, 0, -1] }
	}
};

const PIGEON_FOLD = {
	hips: { pos: [0, 0.26, 0], dir: [0, 0.75, 1], face: [0, -1, 0.75] },
	bones: {
		...PIGEON_UP.bones,
		Spine: [0, 0.3, 1],
		Spine1: [0, -0.05, 1],
		Spine2: [0, -0.3, 1],
		Neck: [0, -0.55, 1],
		Head: [0, -0.8, 0.7],
		LeftShoulder: { dir: [1, 0, 0.2], face: [0, -1, 0] },
		RightShoulder: { dir: [-1, 0, 0.2], face: [0, -1, 0] },
		LeftHand: { dir: [0.05, -0.05, 1], face: [-1, 0, 0] },
		RightHand: { dir: [-0.05, -0.05, 1], face: [1, 0, 0] }
	},
	ik: {
		LeftHand: { target: [0.18, 0.06, 0.85], pole: [0.3, -0.2, -1] },
		RightHand: { target: [-0.18, 0.06, 0.85], pole: [-0.3, -0.2, -1] }
	}
};

export const CORE = [
	{
		id: 'forward-fold',
		name: 'Forward Fold',
		seed: 'Forward Fold',
		view: { azimuth: 82, elevation: 6 },
		icon: 'fold',
		poses: { stand: STAND, fold: FOLD },
		timeline: [
			{ pose: 'stand', hold: 0.8, in: 2.2 },
			{ pose: 'fold', in: 2.6, hold: 1.8 }
		]
	},
	{
		id: 'cat-cow',
		name: 'Cat-Cow',
		seed: 'Cat-Cow',
		view: { azimuth: 84, elevation: 8 },
		icon: 'cat',
		props: [{ kind: 'mat' }],
		poses: { neutral: QUAD_NEUTRAL, cat: CAT, cow: COW },
		timeline: [
			{ pose: 'neutral', hold: 0.3, in: 1.2 },
			{ pose: 'cow', in: 1.4, hold: 0.9 },
			{ pose: 'cat', in: 2.0, hold: 0.9 }
		]
	},
	{
		id: 'pigeon',
		name: 'Pigeon Stretch',
		seed: 'Pigeon Stretch',
		bilateral: true,
		view: { azimuth: 45, elevation: 30 },
		icon: 'up',
		props: [{ kind: 'mat' }],
		poses: { up: PIGEON_UP, fold: PIGEON_FOLD },
		timeline: [
			{ pose: 'up', hold: 1.0, in: 2.4 },
			{ pose: 'fold', in: 2.6, hold: 2.0 }
		]
	}
];
